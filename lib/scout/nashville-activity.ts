import permits from './data/nashville-permits-2026-11-19.json';
import sales from './data/nashville-sales-2026-11-19.json';
const ZIPS = ['37204','37205','37206','37209','37212','37215','37220','37221'];
export const nashvilleActivityTool = {
  name: 'query_nashville_activity',
  description: 'Query collected Nashville permit/sale records, snapshot November19 2026. Issued feed 9872 rows/9864 distinct permit numbers, 2023-11-19 through 2026-11-18. Sales 6542 assessment-report rows, publication only through September2026; not verified land comps or luxury new builds. Returns observed monthly counts and source-linked rows. Use for permits/pipeline and sale evidence, not verified starts/completions or builder identities. These records extend beyond the 406 candidate lots. Filter parcel_ids when answering about a shortlist. No fabricated sale averages or allocating bundled consideration.',
  input_schema: { type:'object', properties: { dataset:{type:'string',enum:['permits','sales']}, zips:{type:'array',items:{type:'string'}}, parcel_ids:{type:'array',items:{type:'string'}}, start_date:{type:'string',description:'YYYY-MM-DD inclusive'}, end_date:{type:'string',description:'YYYY-MM-DD inclusive'}, permit_type_contains:{type:'string',description:'For housing pipeline use Building Residential - New; all permit types are not a housing supply metric.'}, permit_subtype_contains:{type:'string'}, offset:{type:'integer',minimum:0} }, required:['dataset'], additionalProperties:false },
};
export function queryNashvilleActivity(input: any) {
  if (!input || !['permits','sales'].includes(input.dataset)) return {error:'Choose permits or sales'};
  const zips = input.zips ?? ZIPS;
  if (!Array.isArray(zips) || !zips.length || zips.some(z => !ZIPS.includes(z))) return {status:'outside_snapshot_coverage',supported_zips:ZIPS};
  const ids=input.parcel_ids ?? [];
  if (!Array.isArray(ids)|| ids.some(id=>typeof id!=='string')) return {error:'Invalid parcel IDs'};
  const start=input.start_date??'0000-01-01',end=input.end_date??'9999-12-31';
  if (![start,end].every(d=>typeof d==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d))||start>end) return {error:'Invalid date range'};
  if (input.permit_type_contains !== undefined && typeof input.permit_type_contains !== 'string') return {error:'Invalid type'};
  if (input.permit_subtype_contains !== undefined && typeof input.permit_subtype_contains !== 'string') return {error:'Invalid subtype'};
  const permit = input.dataset==='permits';
  const rows = (permit ? permits : sales).filter((r:any)=>{
    const date=String(permit?r.issued_at:r.assessor_report_sale_date).slice(0,10);
    const key=permit?r.parcel_key:'47037:'+r.apn;
    return zips.includes(permit?r.permit_zip:r.situs_zip)&&date>=start&&date<=end&&(!ids.length||ids.includes(key)||ids.includes(key.replace('47037:','')))&&(!permit||!input.permit_type_contains||r.permit_type.toLowerCase().includes(input.permit_type_contains.toLowerCase()))&&(!permit||!input.permit_subtype_contains||r.permit_subtype.toLowerCase().includes(input.permit_subtype_contains.toLowerCase()));
  });
  const unique = permit ? [...new Map(rows.map((r:any)=>[r.permit_number,r])).values()] : rows;
  const monthly:Record<string,number>={};
  for(const r of unique as any[]) {const month=String(permit?r.issued_at:r.assessor_report_sale_date).slice(0,7);monthly[month]=(monthly[month]??0)+1;}
  const offset=Number.isInteger(input.offset)&&input.offset>=0?input.offset:0;
  const sample=unique.slice(offset,offset+10);
  return {snapshot_date:'2026-11-19',dataset:input.dataset,filters:{zips,parcel_ids:ids,start,end,permit_type_contains:input.permit_type_contains,permit_subtype_contains:input.permit_subtype_contains},raw_matching_rows:rows.length,count:unique.length,count_unit:permit?'distinct permit numbers, not dwelling units or starts':'assessment sale observations, not qualified comparable transactions',observed_monthly_counts:monthly,records:sample,next_offset:offset+10<unique.length?offset+10:null,
    coverage:permit?'Published rolling issued-permit feed: 2023-11-19–2026-11-18. Missing dates/months are not certified zero; queried ZIP attributes and exact parcel joins only. Not all satellite-city authorities.':'Assessment sale reports published only through September2026, not a complete deed chain or a complete rolling-year transaction universe.',
    limitations:permit?['All permit types mix new housing, rehab, demolition, signs and commercial work. For new-housing pipeline filter Building Residential - New and label permit counts, not units. Issued permits do not establish starts/completions. No inspection milestones or certificate-of-occupancy data connected. Deduplicated by permit number; amendment rows may differ. Do not compare partial and full periods as equivalent.']:['Buyer/builder identities not verified. New-construction/luxury classifications and listing history absent. Consideration can cover multiple parcels; never divide evenly or compute land price per sq ft without qualifying the transaction and denominator. An assessed sale is not necessarily vacant-land or arms-length.'],
    sources:permit?[{name:'Metro issued permit feed',url:'https://services2.arcgis.com/HdTo6HJqh92wn4D8/arcgis/rest/services/Building_Permits_Issued_2/FeatureServer/0'}]:[...new Set(sample.map((r:any)=>r.source_url))].filter(Boolean).slice(0,3).map(url=>({name:'Davidson assessor sale report',url})),
  };
}
