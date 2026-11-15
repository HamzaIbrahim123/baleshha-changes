/** The API is server-side only. Never expose the Neon DATABASE_URL in the browser. */
export type ApiUser = {id:string; username:string; displayName:string};
export type AuthResponse = {user:ApiUser};
export type MeResponse = {user:ApiUser|null};

export class ApiRequestError extends Error {
  constructor(readonly code:string, message:string, readonly status:number){super(message);this.name='ApiRequestError'}
}

const apiBase=(import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/,'');

async function request<T>(path:string, method:'GET'|'POST', data?:object):Promise<T> {
  const response=await fetch(`${apiBase}/api${path}`,{
    method,
    credentials:'include',
    headers: data ? {'Content-Type':'application/json'}:undefined,
    body: data ? JSON.stringify(data):undefined,
  });
  const payload=await response.json().catch(()=>null);
  if(!response.ok){
    const error=payload?.error;
    throw new ApiRequestError(error?.code??'API_ERROR',error?.message??'Request failed',response.status);
  }
  return (payload??{}) as T;
}
export const apiAuth={
  me:()=>request<MeResponse>('/auth/me','GET'),
  register:(body:{displayName:string;username:string;password:string})=>request<AuthResponse>('/auth/register','POST',body),
  login:(body:{username:string;password:string})=>request<AuthResponse>('/auth/login','POST',body),
  logout:()=>request<Record<string,never>>('/auth/logout','POST'),
};
