import { BertTokenizer } from '@xenova/transformers';
import tokenizerJSON from '@/model/bio_clinical_bert_tokenizer/tokenizer.json';
import tokenizerConfig from '@/model/bio_clinical_bert_tokenizer/tokenizer_config.json';

const tokenizer = new BertTokenizer(tokenizerJSON, tokenizerConfig);
export const nlpTokenizer = async (input: string) =>
  tokenizer(input, { add_special_tokens: true, padding: 'max_length', max_length: 512, truncation: true });
