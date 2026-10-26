import { createPageMetadata } from '@/lib/metadata';
import RegisterClient from '@/components/register/RegisterClient';

export const metadata = createPageMetadata({ title: 'Daftar', description: 'Buat akun Study Buddy baru.', path: '/register' });

export default function Page() {
  return <RegisterClient />;
}
