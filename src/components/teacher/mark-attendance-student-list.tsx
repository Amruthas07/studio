
'use client';

import React from 'react';
import type { Student, AttendanceRecord } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Check, X, LogOut } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from '@/hooks/use-toast';
import { Badge } from '../ui/badge';

interface MarkAttendanceStudentListProps {
  students: Student[];
  today: string;
  getTodaysRecordForStudent: (studentRegister: string, date: string) => AttendanceRecord | undefined;
  onMarkAttendance: (studentRegister: string, status: 'present' | 'absent', reason?: string) => void;
}

const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
};

export function MarkAttendanceStudentList({ students, today, getTodaysRecordForStudent, onMarkAttendance }: MarkAttendanceStudentListProps) {

  const { toast } = useToast();
  const [reason, setReason] = React.useState('');
  
  if (students.length === 0) {
    return <div className="text-center text-muted-foreground p-8">No students found in this department.</div>;
  }
  
  const handleLeaveSubmit = (studentRegister: string) => {
    if (!reason.trim()) {
      toast({
        variant: 'destructive',
        title: 'Reason required',
        description: 'Please provide a reason for the leave.',
      });
      return;
    }
    onMarkAttendance(studentRegister, 'present', reason);
    setReason('');
  }

  return (
    <div className="space-y-4">
      {students.sort((a, b) => a.name.localeCompare(b.name)).map(student => {
        const record = getTodaysRecordForStudent(student.registerNumber, today);
        
        return (
          <div key={student.registerNumber} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={student.profilePhotoUrl} alt={student.name} />
                <AvatarFallback>{getInitials(student.name)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{student.name}</p>
                <p className="text-sm text-muted-foreground">{student.registerNumber}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {record ? (
                record.status === 'present' ? (
                  record.reason ? (
                     <Badge variant="secondary" className="text-base">
                        <LogOut className="mr-2 h-4 w-4"/> On Leave
                     </Badge>
                  ) : (
                     <Badge variant="default" className="text-base bg-green-500 hover:bg-green-600">
                        <Check className="mr-2 h-4 w-4"/> Present
                     </Badge>
                  )
                ) : (
                    <Badge variant="destructive" className="text-base">
                        <X className="mr-2 h-4 w-4"/> Absent
                    </Badge>
                )
              ) : (
                <>
                  <Button size="sm" variant="outline" className="bg-green-100 text-green-800 hover:bg-green-200 border-green-300 dark:bg-green-900/50 dark:text-green-300 dark:hover:bg-green-900 dark:border-green-700" onClick={() => onMarkAttendance(student.registerNumber, 'present')}>
                    <Check className="mr-2 h-4 w-4" /> Present
                  </Button>
                  <Button size="sm" variant="outline" className="bg-red-100 text-red-800 hover:bg-red-200 border-red-300 dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-900 dark:border-red-700" onClick={() => onMarkAttendance(student.registerNumber, 'absent')}>
                    <X className="mr-2 h-4 w-4" /> Absent
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                       <Button size="sm" variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-300 dark:bg-yellow-900/50 dark:text-yellow-300 dark:hover:bg-yellow-900 dark:border-yellow-700">
                          <LogOut className="mr-2 h-4 w-4" /> On Leave
                       </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Mark Leave for {student.name}</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will mark the student as present but on leave. Please provide a reason below.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="grid gap-2">
                            <Label htmlFor="reason">Leave Reason</Label>
                            <Textarea 
                                id="reason"
                                placeholder="e.g., Medical appointment, family function" 
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                            />
                        </div>
                        <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setReason('')}>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleLeaveSubmit(student.registerNumber)}>Submit</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              )}
            </div>
          </div>
        )
      })}
    </div>
  );
}
