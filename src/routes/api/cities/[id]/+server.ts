import { json } from '@sveltejs/kit';

export const GET = async () => {
  return json({ error: 'not_implemented' }, { status: 501 });
};
