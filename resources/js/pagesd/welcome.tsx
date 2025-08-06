import { Button } from '@/components/ui/button';
import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowRight, PiggyBank } from 'lucide-react';

export default function Welcome() {
    const { auth } = usePage<SharedData>().props;

    return (
        <>
            <Head title="Yukon Savings SACCO">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600,700" rel="stylesheet" />
            </Head>

            <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-green-50">
                <div className="mx-auto w-full max-w-md">
                    <div className="rounded-lg bg-white p-8 text-center shadow-lg">
                        {/* Logo */}
                        <div className="mb-8 flex items-center justify-center gap-3">
                            <PiggyBank className="h-12 w-12 text-yellow-500" />
                            <div className="text-left">
                                <h1 className="text-2xl font-bold text-gray-900">Yukon Savings</h1>
                                <p className="text-sm text-center text-gray-600">SACCO</p>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="mb-8">
                            <h2 className="mb-4 text-xl font-semibold text-gray-900">Welcome to Your SACCO Portal</h2>
                            <p className="mb-6 text-gray-600">
                                Please log in to access your savings account, view loan information, and manage your SACCO membership.
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="space-y-3">
                            {auth.user ? (
                                <Link href={route('dashboard')} className="block">
                                    <Button size="lg" className="w-full">
                                        Go to Dashboard
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </Link>
                            ) : (
                                <>
                                    <Link href={route('login')} className="block">
                                        <Button size="lg" className="w-full">
                                            Log In
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    </Link>
                                </>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="mt-8 border-t border-gray-200 pt-6">
                            <p className="text-xs text-gray-500">© {new Date().getFullYear()} Yukon Savings SACCO. All rights reserved.</p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
