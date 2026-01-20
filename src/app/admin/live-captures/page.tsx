
'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, AlertCircle, Info, XCircle } from "lucide-react";
import React from "react";
import Image from "next/image";
import { useLiveCaptures } from "@/hooks/use-live-captures";
import { format } from "date-fns";
import type { LiveCaptureRecord } from "@/lib/types";

const statusConfig = {
    success: { icon: CheckCircle, color: 'bg-green-100 text-green-800', label: 'Success' },
    no_match: { icon: AlertCircle, color: 'bg-yellow-100 text-yellow-800', label: 'No Match' },
    already_marked: { icon: Info, color: 'bg-blue-100 text-blue-800', label: 'Already Marked' },
    error: { icon: XCircle, color: 'bg-red-100 text-red-800', label: 'Error' },
};

const StatusBadge: React.FC<{ status: LiveCaptureRecord['matchResult'] }> = ({ status }) => {
    const config = statusConfig[status] || statusConfig.error;
    const Icon = config.icon;
    return (
        <Badge variant="outline" className={`capitalize gap-1.5 ${config.color}`}>
            <Icon className="h-3.5 w-3.5" />
            {config.label}
        </Badge>
    );
};

export default function LiveCapturesPage() {
    const { liveCaptures, loading } = useLiveCaptures();

    if (loading) {
        return (
            <div className="flex h-full w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight font-headline">
                    Live Capture Log
                </h1>
                <p className="text-muted-foreground">
                    A complete history of all photos captured during live attendance sessions.
                </p>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Capture History</CardTitle>
                    <CardDescription>Showing all identification attempts from the live camera.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Photo</TableHead>
                                <TableHead>Result</TableHead>
                                <TableHead>Matched Student</TableHead>
                                <TableHead>Confidence</TableHead>
                                <TableHead>Timestamp</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {liveCaptures.length > 0 ? liveCaptures.map((record) => (
                                <TableRow key={record.id}>
                                     <TableCell>
                                        <div className="relative h-16 w-16 rounded-md overflow-hidden border">
                                            <Image src={record.photoUrl} alt="Live capture" layout="fill" objectFit="cover" />
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <StatusBadge status={record.matchResult} />
                                    </TableCell>
                                    <TableCell>{record.studentRegister || 'N/A'}</TableCell>
                                     <TableCell>
                                        {record.confidence > 0 ? `${(record.confidence * 100).toFixed(1)}%` : 'N/A'}
                                    </TableCell>
                                    <TableCell>{format(new Date(record.timestamp), "PPpp")}</TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">
                                        No live captures have been recorded yet.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
