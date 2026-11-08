export const GMAIL_SCOPE='https://www.googleapis.com/auth/gmail.readonly';
// Access tokens live only in this module's memory and are cleared when locking.
let token=null,expires=0;
export function clearGmailToken(){token=null;expires=0;}
export function authorizeGmail(clientId){
 if(token&&Date.now()<expires)return Promise.resolve(token);
 if(!/^[\w-]+\.apps\.googleusercontent\.com$/.test(clientId??''))return Promise.reject(new Error('Connect Gmail in Settings first. Google needs a one-time OAuth app setup.'));
 if(!globalThis.google?.accounts?.oauth2)return Promise.reject(new Error('Google sign-in is still loading or was blocked. Try Refresh Gmail again.'));
 return new Promise((resolve,reject)=>{
 const client=google.accounts.oauth2.initTokenClient({client_id:clientId,scope:GMAIL_SCOPE,include_granted_scopes:false,callback:response=>{
 if(response.error||!response.access_token||!google.accounts.oauth2.hasGrantedAllScopes(response,GMAIL_SCOPE)){reject(new Error('Gmail read access was not granted. Your tracker is unchanged.'));return;}
 token=response.access_token;expires=Date.now()+Math.max(0,Number(response.expires_in)-60)*1000;resolve(token);
 },error_callback:()=>reject(new Error('Google sign-in was closed or blocked. Select Refresh Gmail to try again.'))});
 client.requestAccessToken({prompt:''});
 });
}
export async function readGmail(accessToken,state={},request=fetch){
 const get=async(path,params={})=>{const url=new URL('https://gmail.googleapis.com/gmail/v1/users/me/'+path);for(const [k,v]of Object.entries(params))if(v)url.searchParams.set(k,v);const r=await request(url,{headers:{Authorization:'Bearer '+accessToken},signal:AbortSignal.timeout(30000)});if(!r.ok){let detail='';try{const payload=await r.json();detail=payload.error?.message??'';}catch{}if(r.status===401)clearGmailToken();if(r.status===403)throw new Error(`Google denied Gmail access (${r.status})${detail?': '+detail:''}. Your saved records are unchanged.`);throw new Error(r.status===401?'Google access expired. Select Refresh Gmail to reconnect.':`Gmail could not finish this check (${r.status})${detail?': '+detail:''}. Your saved records are unchanged; try again.`);}return r.json();};
 const profile=await get('profile');if(state.email&&state.email.toLowerCase()!==profile.emailAddress.toLowerCase())throw new Error('This Google account differs from the mailbox already connected to this tracker. Select the original account.');
 const until=state.until??Date.now();const since=state.since??(state.completedAt?Date.parse(state.completedAt)-7*86400000:until-180*86400000);
 // Include inbox outreach AND archived application confirmations; exclude sent/drafts.
 const q=`after:${Math.floor(since/1000)} before:${Math.floor(until/1000)+1} -in:sent -in:drafts {application applying interview recruiter recruiting opportunity assessment candidacy candidate hiring "your profile" "your background" "reference check" "hiring manager" "phone screen"}`;
 const page=await get('messages',{q,maxResults:'50',pageToken:state.pageToken});const messages=[];
 const items=page.messages??[];for(let i=0;i<items.length;i+=5){const batch=await Promise.all(items.slice(i,i+5).map(item=>get('messages/'+encodeURIComponent(item.id),{format:'full'})));messages.push(...batch);}
 const nextState=page.nextPageToken?{email:profile.emailAddress,since,until,pageToken:page.nextPageToken,completedAt:state.completedAt??null}:{email:profile.emailAddress,completedAt:new Date(until).toISOString()};
 return {messages,state:nextState,more:!!page.nextPageToken};
}
