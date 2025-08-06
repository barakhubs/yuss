import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { type NavItem, type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { ArrowUpDown, CreditCard, LayoutGrid, Settings, TrendingUp, Users2, Wallet } from 'lucide-react';
import AppLogo from './app-logo';

// Member navigation items (all users)
const memberNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/sacco',
        icon: LayoutGrid,
    },
    {
        title: 'My Loans',
        href: '/sacco/loans',
        icon: CreditCard,
    },
    {
        title: 'My Savings',
        href: '/sacco/savings',
        icon: Wallet,
    },
];

// Admin/Committee navigation items (additional items for admins/committee)
const adminNavItems: NavItem[] = [
    {
        title: 'Loan Management',
        href: '/sacco/loans',
        icon: CreditCard,
    },
    {
        title: 'Savings Overview',
        href: '/sacco/savings/summary',
        icon: TrendingUp,
    },
    {
        title: 'Share-Out',
        href: '/sacco/savings/share-out',
        icon: ArrowUpDown,
    },
    {
        title: 'Member Management',
        href: '/sacco/members',
        icon: Users2,
    },
    {
        title: 'Invite Users',
        href: '/invitations/create',
        icon: Users2,
    },
    {
        title: 'SACCO Settings',
        href: '/sacco/settings/quarters',
        icon: Settings,
    },
    {
        title: 'Profile Settings',
        href: '/settings/profile',
        icon: Settings,
    },
];


export function AppSidebar() {
    const page = usePage<SharedData>();

    // Check if user has admin or committee role
    const user = page.props.auth?.user;
    const userRole = user?.role as string | undefined;
    const isAdmin = userRole === 'chairperson';
    const isCommittee = userRole && ['chairperson', 'secretary', 'treasurer', 'disburser'].includes(userRole);

    // Determine which navigation items to show
    const navItems =
        isAdmin || isCommittee
            ? [
                  {
                      title: 'Dashboard',
                      href: '/sacco',
                      icon: LayoutGrid,
                  },
                  ...adminNavItems,
              ]
            : memberNavItems;

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/sacco" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                {/* Main Navigation */}
                <SidebarGroup className="px-2 py-0">
                    <SidebarMenu>
                        {navItems.map((item) => (
                            <SidebarMenuItem key={item.title}>
                                <SidebarMenuButton asChild isActive={page.url.startsWith(item.href)} tooltip={{ children: item.title }}>
                                    <Link href={item.href} prefetch>
                                        {item.icon && <item.icon />}
                                        <span>{item.title}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
