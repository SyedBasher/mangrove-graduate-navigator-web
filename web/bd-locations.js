// Controlled Bangladesh administrative geography for the assessment.
// These are stable internal slugs paired with canonical English names. An official
// BBS numeric-code crosswalk can be attached later without cleaning free text.
export const bdLocations = [
  { code: 'barishal', en: 'Barishal', bn: 'বরিশাল', districts: [
    ['barguna','Barguna','বরগুনা'],['barishal','Barishal','বরিশাল'],['bhola','Bhola','ভোলা'],['jhalokathi','Jhalokathi','ঝালকাঠি'],['patuakhali','Patuakhali','পটুয়াখালী'],['pirojpur','Pirojpur','পিরোজপুর']
  ]},
  { code: 'chattogram', en: 'Chattogram', bn: 'চট্টগ্রাম', districts: [
    ['bandarban','Bandarban','বান্দরবান'],['brahmanbaria','Brahmanbaria','ব্রাহ্মণবাড়িয়া'],['chandpur','Chandpur','চাঁদপুর'],['chattogram','Chattogram','চট্টগ্রাম'],['cumilla','Cumilla','কুমিল্লা'],['coxs_bazar',"Cox's Bazar",'কক্সবাজার'],['feni','Feni','ফেনী'],['khagrachhari','Khagrachhari','খাগড়াছড়ি'],['lakshmipur','Lakshmipur','লক্ষ্মীপুর'],['noakhali','Noakhali','নোয়াখালী'],['rangamati','Rangamati','রাঙ্গামাটি']
  ]},
  { code: 'dhaka', en: 'Dhaka', bn: 'ঢাকা', districts: [
    ['dhaka','Dhaka','ঢাকা'],['faridpur','Faridpur','ফরিদপুর'],['gazipur','Gazipur','গাজীপুর'],['gopalganj','Gopalganj','গোপালগঞ্জ'],['kishoreganj','Kishoreganj','কিশোরগঞ্জ'],['madaripur','Madaripur','মাদারীপুর'],['manikganj','Manikganj','মানিকগঞ্জ'],['munshiganj','Munshiganj','মুন্সিগঞ্জ'],['narayanganj','Narayanganj','নারায়ণগঞ্জ'],['narsingdi','Narsingdi','নরসিংদী'],['rajbari','Rajbari','রাজবাড়ী'],['shariatpur','Shariatpur','শরীয়তপুর'],['tangail','Tangail','টাঙ্গাইল']
  ]},
  { code: 'khulna', en: 'Khulna', bn: 'খুলনা', districts: [
    ['bagerhat','Bagerhat','বাগেরহাট'],['chuadanga','Chuadanga','চুয়াডাঙ্গা'],['jashore','Jashore','যশোর'],['jhenaidah','Jhenaidah','ঝিনাইদহ'],['khulna','Khulna','খুলনা'],['kushtia','Kushtia','কুষ্টিয়া'],['magura','Magura','মাগুরা'],['meherpur','Meherpur','মেহেরপুর'],['narail','Narail','নড়াইল'],['satkhira','Satkhira','সাতক্ষীরা']
  ]},
  { code: 'mymensingh', en: 'Mymensingh', bn: 'ময়মনসিংহ', districts: [
    ['jamalpur','Jamalpur','জামালপুর'],['mymensingh','Mymensingh','ময়মনসিংহ'],['netrokona','Netrokona','নেত্রকোনা'],['sherpur','Sherpur','শেরপুর']
  ]},
  { code: 'rajshahi', en: 'Rajshahi', bn: 'রাজশাহী', districts: [
    ['bogura','Bogura','বগুড়া'],['chapainawabganj','Chapainawabganj','চাঁপাইনবাবগঞ্জ'],['joypurhat','Joypurhat','জয়পুরহাট'],['naogaon','Naogaon','নওগাঁ'],['natore','Natore','নাটোর'],['pabna','Pabna','পাবনা'],['rajshahi','Rajshahi','রাজশাহী'],['sirajganj','Sirajganj','সিরাজগঞ্জ']
  ]},
  { code: 'rangpur', en: 'Rangpur', bn: 'রংপুর', districts: [
    ['dinajpur','Dinajpur','দিনাজপুর'],['gaibandha','Gaibandha','গাইবান্ধা'],['kurigram','Kurigram','কুড়িগ্রাম'],['lalmonirhat','Lalmonirhat','লালমনিরহাট'],['nilphamari','Nilphamari','নীলফামারী'],['panchagarh','Panchagarh','পঞ্চগড়'],['rangpur','Rangpur','রংপুর'],['thakurgaon','Thakurgaon','ঠাকুরগাঁও']
  ]},
  { code: 'sylhet', en: 'Sylhet', bn: 'সিলেট', districts: [
    ['habiganj','Habiganj','হবিগঞ্জ'],['moulvibazar','Moulvibazar','মৌলভীবাজার'],['sunamganj','Sunamganj','সুনামগঞ্জ'],['sylhet','Sylhet','সিলেট']
  ]},
];

export function divisionOptions(lang = 'en', selected = '') {
  const choose = lang === 'en' ? 'Choose division' : 'বিভাগ বেছে নিন';
  return [`<option value="">${choose}</option>`, ...bdLocations.map(d => `<option value="${d.code}" ${d.code === selected ? 'selected' : ''}>${lang === 'en' ? d.en : d.bn}</option>`)].join('');
}

export function districtOptions(divisionCode, lang = 'en', selected = '') {
  const division = bdLocations.find(d => d.code === divisionCode);
  const choose = lang === 'en' ? 'Choose district' : 'জেলা বেছে নিন';
  if (!division) return `<option value="">${choose}</option>`;
  return [`<option value="">${choose}</option>`, ...division.districts.map(([code,en,bn]) => `<option value="${code}" ${code === selected ? 'selected' : ''}>${lang === 'en' ? en : bn}</option>`)].join('');
}

export function allDistrictOptions(lang = 'en', selected = '') {
  const choose = lang === 'en' ? 'Choose district' : 'জেলা বেছে নিন';
  const rows = bdLocations.flatMap(division => division.districts.map(([code,en,bn]) => ({
    code, en, bn, divisionCode:division.code,
  })));
  return [`<option value="">${choose}</option>`, ...rows
    .sort((a,b) => (lang === 'en' ? a.en.localeCompare(b.en) : a.bn.localeCompare(b.bn, 'bn')))
    .map(d => `<option value="${d.code}" ${d.code === selected ? 'selected' : ''}>${lang === 'en' ? d.en : d.bn}</option>`)
  ].join('');
}

export function divisionForDistrict(districtCode = '') {
  return bdLocations.find(division => division.districts.some(([code]) => code === districtCode))?.code || '';
}
