import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { formatEuros } from '@/lib/currency';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, BarChart3, Calendar, Download, PiggyBank, TrendingUp, Users } from 'lucide-react';

interface User {
    id: number;
    name: string;
    email: string;
}

interface QuarterSummary {
    quarter: number;
    year: number;
    total_savings: number;
    member_count: number;
    average_per_member: number;
    members: Array<{
        user: User;
        total_amount: number;
        contributions_count: number;
    }>;
}

interface YearSummary {
    year: number;
    total_savings: number;
    total_members: number;
    quarters: QuarterSummary[];
}

interface SavingsSummaryProps {
    yearSummaries: YearSummary[];
    overallStats: {
        total_all_time: number;
        total_active_members: number;
        average_per_member_all_time: number;
        highest_quarter_savings: {
            quarter: number;
            year: number;
            amount: number;
        };
        most_active_member: {
            user: User;
            total_savings: number;
            quarters_participated: number;
        };
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'SACCO', href: '/sacco' },
    { title: 'Savings', href: '/sacco/savings' },
    { title: 'Summary Report', href: '/sacco/savings/summary' },
];

export default function SavingsSummary({ yearSummaries, overallStats }: SavingsSummaryProps) {
    const handleExport = () => {
        // This would typically export to CSV or PDF
        console.log('Export functionality would be implemented here');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Savings Summary Report - SACCO" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/sacco/savings">
                            <Button variant="outline" size="sm">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Savings
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Savings Summary Report</h1>
                            <p className="text-muted-foreground">Comprehensive overview of all member savings</p>
                        </div>
                    </div>

                    <Button onClick={handleExport} variant="outline">
                        <Download className="mr-2 h-4 w-4" />
                        Export Report
                    </Button>
                </div>

                {/* Overall Statistics */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total All-Time</CardTitle>
                            <PiggyBank className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatEuros(overallStats.total_all_time)}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Members</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{overallStats.total_active_members}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Average per Member</CardTitle>
                            <BarChart3 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatEuros(overallStats.average_per_member_all_time)}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Best Quarter</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-lg font-bold">{formatEuros(overallStats.highest_quarter_savings.amount)}</div>
                            <p className="text-xs text-muted-foreground">
                                Q{overallStats.highest_quarter_savings.quarter} {overallStats.highest_quarter_savings.year}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Top Saver</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-lg font-bold">{formatEuros(overallStats.most_active_member.total_savings)}</div>
                            <p className="text-xs text-muted-foreground">{overallStats.most_active_member.user.name}</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Year by Year Summary */}
                {yearSummaries.map((yearSummary) => (
                    <Card key={yearSummary.year}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="h-5 w-5" />
                                {yearSummary.year} Summary
                            </CardTitle>
                            <CardDescription>
                                Total: {formatEuros(yearSummary.total_savings)} • Members: {yearSummary.total_members}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 lg:grid-cols-3">
                                {yearSummary.quarters.map((quarter) => (
                                    <Card key={quarter.quarter}>
                                        <CardHeader className="pb-4">
                                            <CardTitle className="text-lg">Quarter {quarter.quarter}</CardTitle>
                                            <div className="space-y-1">
                                                <p className="text-2xl font-bold">{formatEuros(quarter.total_savings)}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {quarter.member_count} members • Avg: {formatEuros(quarter.average_per_member)}
                                                </p>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="pt-0">
                                            <div className="space-y-2">
                                                <h4 className="text-sm font-medium">Top Contributors</h4>
                                                {quarter.members.slice(0, 3).map((member) => (
                                                    <div key={member.user.id} className="flex items-center justify-between text-sm">
                                                        <span className="truncate">{member.user.name}</span>
                                                        <Badge variant="outline">{formatEuros(member.total_amount)}</Badge>
                                                    </div>
                                                ))}
                                                {quarter.members.length > 3 && (
                                                    <p className="text-xs text-muted-foreground">+{quarter.members.length - 3} more members</p>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {/* Detailed Member Breakdown */}
                <Card>
                    <CardHeader>
                        <CardTitle>Member Savings Breakdown</CardTitle>
                        <CardDescription>Detailed view of each member's savings across all quarters</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Member</TableHead>
                                    <TableHead>Total Savings</TableHead>
                                    <TableHead>Quarters Active</TableHead>
                                    <TableHead>Average per Quarter</TableHead>
                                    <TableHead>Latest Activity</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {/* This would be populated with aggregated member data */}
                                {yearSummaries
                                    .flatMap((year) =>
                                        year.quarters.flatMap((quarter) =>
                                            quarter.members.map((member) => ({
                                                ...member,
                                                quarter: quarter.quarter,
                                                year: year.year,
                                            })),
                                        ),
                                    )
                                    .reduce(
                                        (acc, current) => {
                                            const existing = acc.find((item) => item.user.id === current.user.id);
                                            if (existing) {
                                                existing.total_amount += current.total_amount;
                                                existing.quarters_count += 1;
                                                if (
                                                    current.year > existing.latest_year ||
                                                    (current.year === existing.latest_year && current.quarter > existing.latest_quarter)
                                                ) {
                                                    existing.latest_year = current.year;
                                                    existing.latest_quarter = current.quarter;
                                                }
                                            } else {
                                                acc.push({
                                                    user: current.user,
                                                    total_amount: current.total_amount,
                                                    quarters_count: 1,
                                                    latest_year: current.year,
                                                    latest_quarter: current.quarter,
                                                });
                                            }
                                            return acc;
                                        },
                                        [] as Array<{
                                            user: User;
                                            total_amount: number;
                                            quarters_count: number;
                                            latest_year: number;
                                            latest_quarter: number;
                                        }>,
                                    )
                                    .sort((a, b) => b.total_amount - a.total_amount)
                                    .map((member) => (
                                        <TableRow key={member.user.id}>
                                            <TableCell>
                                                <div>
                                                    <div className="font-medium">{member.user.name}</div>
                                                    <div className="text-sm text-muted-foreground">{member.user.email}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-medium">{formatEuros(member.total_amount)}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{member.quarters_count} quarters</Badge>
                                            </TableCell>
                                            <TableCell>{formatEuros(member.total_amount / member.quarters_count)}</TableCell>
                                            <TableCell>
                                                Q{member.latest_quarter} {member.latest_year}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
