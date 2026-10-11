export function CompanyLogo({name,mark}:{name:string;mark?:string}){
 const file=name==='NRK'?'nrk':name==='VG'?'vg':null
 return <span className={'company-logo '+(file||'company-logo-fallback')}>{file?<img src={'/logos/'+file+'.svg'} alt={name+' logo'}/>:<span aria-hidden="true">{mark||name[0]}</span>}</span>
}
