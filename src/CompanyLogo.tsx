const LOGOS:Record<string,string>={NRK:'nrk',VG:'vg',TINE:'tine',Vipps:'vipps',DNB:'dnb',Telenor:'telenor'}
export function CompanyLogo({name,mark}:{name:string;mark?:string}){
 const file=LOGOS[name]
 return <span className={'company-logo '+(file||'company-logo-fallback')}>{file?<img src={'/logos/'+file+'.svg'} alt={name+' logo'}/>:<span aria-hidden="true">{mark||name[0]}</span>}</span>
}
