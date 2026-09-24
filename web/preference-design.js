// Preference wording v0.5.4; repeated-pair scoring graph remains 0.5.1.
// Five recurring work attributes are compared across eight trade-offs.
// Exposure counts are intentionally near-balanced: analysis=4; all others=3.
// This creates repeated measurement and several transitivity checks without
// lengthening the assessment. Repeated analysis/precision wording intentionally
// keeps the core construct stable while the alternative changes.

export const preferenceAttributes = {
  analysis_precision: { en:'Analysis & precision', bn:'বিশ্লেষণ ও নির্ভুলতা' },
  people_influence: { en:'People & influence', bn:'মানুষের সঙ্গে কাজ ও প্রভাব' },
  structure_predictability: { en:'Structure & predictability', bn:'গুছানো ও আগে থেকে বোঝা যায় এমন কাজ' },
  growth_autonomy: { en:'Learning, variety & autonomy', bn:'শেখা, বৈচিত্র্য ও স্বাধীনতা' },
  field_operations: { en:'Field & operational work', bn:'ফিল্ড ও অপারেশনাল কাজ' },
};

const analysisEn = 'Working carefully with information, numbers or details where accuracy matters';
const analysisBn = 'তথ্য, সংখ্যা বা খুঁটিনাটি নিয়ে সতর্কভাবে কাজ করা, যেখানে নির্ভুলতা গুরুত্বপূর্ণ';

export const preferenceItems = [
  { code:'p_analysis_people', attr_a:'analysis_precision', attr_b:'people_influence', a_en:analysisEn, b_en:'Working with people, clients or teams and influencing decisions', a_bn:analysisBn, b_bn:'মানুষ, ক্লায়েন্ট বা টিমের সঙ্গে কাজ করে সিদ্ধান্তে প্রভাব রাখা' },
  { code:'p_structure_analysis', attr_a:'structure_predictability', attr_b:'analysis_precision', a_en:'Clear processes, defined responsibilities and predictable routines', b_en:analysisEn, a_bn:'পরিষ্কার কাজের ধারা, নির্দিষ্ট দায়িত্ব এবং আগে থেকে বোঝা যায় এমন রুটিন', b_bn:analysisBn },
  { code:'p_growth_analysis', attr_a:'growth_autonomy', attr_b:'analysis_precision', a_en:'Varied work where you learn quickly and choose how to approach tasks', b_en:analysisEn, a_bn:'বৈচিত্র্যময় কাজ, যেখানে দ্রুত শেখা ও কাজের পদ্ধতি বেছে নেওয়ার সুযোগ আছে', b_bn:analysisBn },
  { code:'p_analysis_field', attr_a:'analysis_precision', attr_b:'field_operations', a_en:analysisEn, b_en:'Regular site, field or operational work away from the desk', a_bn:analysisBn, b_bn:'ডেস্কের বাইরে নিয়মিত সাইট, ফিল্ড বা অপারেশনাল কাজ' },
  { code:'p_people_structure', attr_a:'people_influence', attr_b:'structure_predictability', a_en:'Frequent collaboration, discussion and relationship-building', b_en:'A clearly defined role with stable expectations and processes', a_bn:'ঘন ঘন দলগত কাজ, আলোচনা ও সম্পর্ক গড়ে তোলা', b_bn:'স্পষ্টভাবে নির্ধারিত দায়িত্ব, স্থিতিশীল প্রত্যাশা ও পরিষ্কার কাজের ধারা' },
  { code:'p_growth_people', attr_a:'growth_autonomy', attr_b:'people_influence', a_en:'Autonomy, variety and room to take on new kinds of work', b_en:'A role centred on customers, colleagues or stakeholders', a_bn:'স্বাধীনতা, বৈচিত্র্য ও নতুন ধরনের কাজ নেওয়ার সুযোগ', b_bn:'গ্রাহক, সহকর্মী বা অংশীজনকে কেন্দ্র করে কাজ' },
  { code:'p_field_structure', attr_a:'field_operations', attr_b:'structure_predictability', a_en:'A mix of office work with field or site visits and practical observation', b_en:'Mostly predictable office-based work with clear procedures', a_bn:'অফিসের কাজের সঙ্গে ফিল্ড বা সাইট ভিজিট এবং বাস্তব পর্যবেক্ষণের মিশ্রণ', b_bn:'পরিষ্কার নিয়মে চলে এমন, আগে থেকে মোটামুটি বোঝা যায় এমন অফিসের কাজ' },
  { code:'p_field_growth', attr_a:'field_operations', attr_b:'growth_autonomy', a_en:'Hands-on or field-based work where conditions can change in real time', b_en:'Office or desk work with variety, learning and freedom in how you organise it', a_bn:'হাতে-কলমে বা ফিল্ডভিত্তিক কাজ, যেখানে পরিস্থিতি তাৎক্ষণিক বদলাতে পারে', b_bn:'অফিস বা ডেস্কের কাজ, যেখানে বৈচিত্র্য, শেখা ও নিজের মতো গুছানোর স্বাধীনতা আছে' },
];

export const preferenceTriangles = [
  ['analysis_precision', 'people_influence', 'structure_predictability'],
  ['analysis_precision', 'people_influence', 'growth_autonomy'],
  ['analysis_precision', 'structure_predictability', 'field_operations'],
  ['analysis_precision', 'growth_autonomy', 'field_operations'],
];
