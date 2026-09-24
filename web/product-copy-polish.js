// Final readability pass based on bilingual pilot feedback.
// This layer changes wording only. Capability codes, response levels and scoring are unchanged.
import { copy, capabilityItems } from './data-refined.js';

copy.en.profileLede = 'Just enough to keep the suggestions relevant to your background.';
copy.bn.profileLede = 'শুধু প্রয়োজনীয় কয়েকটি তথ্য, যাতে পরামর্শগুলো আপনার পটভূমির সঙ্গে মেলে।';

const EN_OVERRIDES = {
  research_information: {
    strong: 'I can find several relevant sources, judge how reliable they are, work through differences between them, and explain what conclusion the information supports.',
    working: 'I can find and compare useful sources independently; if the information is unclear or different sources disagree, I may need a second opinion.',
  },
  clear_writing: {
    strong: 'I can structure the message for the reader, choose the right tone, make it shorter and clearer, and check facts before sending.',
    working: 'My draft is usually clear and usable; I sometimes need editing for structure, tone, or to make it shorter and clearer.',
  },
  operational_problem_solving: {
    working: 'I solve familiar problems independently; for problems that are not clear-cut, I gather information first and then discuss with someone experienced if needed.',
  },
  fieldwork_data_collection: {
    basic: 'I can follow a clear form or checklist, but without guidance I may miss useful follow-up questions, verification, or other details.',
  },
};

for (const item of capabilityItems) {
  const overrides = EN_OVERRIDES[item.code];
  if (!overrides) continue;
  for (const option of item.options || []) {
    if (overrides[option.value]) option.en = overrides[option.value];
  }
}
