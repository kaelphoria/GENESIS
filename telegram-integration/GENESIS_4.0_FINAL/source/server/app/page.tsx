import {redirect} from 'next/navigation';import {getUser} from '@/lib/auth';import {ensureUserWorkspace} from '@/lib/seed-user';import Dashboard from '@/components/Dashboard';
export default async function Home(){const user=await getUser();if(!user)redirect('/login');await ensureUserWorkspace(user.id);return <Dashboard email={user.email}/>}
