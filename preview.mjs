// In-memory interface preview. Never fetches, persists, or imports private records.
import {validateApplication,validatePreferences,toCSV} from './validation.mjs';
const preferences={interests:['Research','Investigations'],industries:['Technology'],locations:['New York'],employers:[],minSalary:70000,remotePreferred:true,weights:{role:35,skills:25,industry:15,compensation:10,location:10,seniority:5},constraints:'',verifiedSkills:[]};
const state={profile:{email:'preview@example.test',preferences},jobs:[],applications:[],documents:[],buckets:[],matchingResume:null,activity:[],discovery:{running:false,sources:[],lastSuccessfulAt:null},schedule:{hours:0},integrations:{gmail:{configured:false,connected:false,running:false},resume:{configured:false,implemented:false},ai:{configured:false}},gmailReview:[],totalIngested:0};
const clone=value=>structuredClone(value);
const unavailable=()=>{throw new Error('The private backend is not connected. This preview does not import jobs, Gmail, or personal documents.');};
function activity(summary){state.activity.unshift({id:crypto.randomUUID(),kind:'application',summary,createdAt:new Date().toISOString()});}
export async function previewAPI(path,method='GET',input){
 if(path==='session')return {authenticated:true,ownerExists:true,setupAllowed:false};
 if(path==='bootstrap')return clone(state);
 if(path==='sync')return {discovery:clone(state.discovery),gmail:clone(state.integrations.gmail)};
 if(path==='logout')throw new Error('This is a public interface preview. No account is signed in.');
 if(path==='applications'&&method==='POST'){
  const record={...validateApplication(input),id:crypto.randomUUID(),jobId:null,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};
  state.applications.push(record);activity('Preview application added.');return {id:record.id};
 }
 const match=path.match(/^applications\/([a-f0-9-]+)$/);
 if(match){const index=state.applications.findIndex(a=>a.id===match[1]);if(index<0)throw new Error('Application not found.');
  if(method==='PUT'){state.applications[index]={...state.applications[index],...validateApplication(input),updatedAt:new Date().toISOString()};activity('Preview application updated.');return {ok:true};}
  if(method==='DELETE'){state.applications.splice(index,1);activity('Preview application removed.');return {ok:true};}
 }
 if(path==='preferences'&&method==='PUT'){state.profile.preferences=validatePreferences(input);return {ok:true};}
 return unavailable();
}
export function exportPreview(csv=false){return csv?toCSV(state.applications):JSON.stringify({preview:true,applications:state.applications,profile:state.profile},null,2);}
