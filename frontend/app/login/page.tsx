import { createPageMetadata } from '@/lib/metadata';
import LoginClient from '@/components/login/LoginClient';

export const metadata = createPageMetadata({ title: 'Masuk', description: 'Masuk ke akun Study Buddy.', path: '/login' });

export default function Page() {
  return <LoginClient />;
}
