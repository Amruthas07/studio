'use client';

import React from 'react';
import type { Student, AttendanceRecord } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, FileClock } from 'lucide-react';
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
import { Progress } from '../ui/progress';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';

interface MarkAttendanceStudentListProps {
  students: Student[];
  allDepartmentRecords: AttendanceRecord[];
  onMarkAttendance: (studentRegister: string, status: 'present' | 'absent', reason?: string) => void;
}

const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
};

const MarkLeaveButton = ({ student, onMarkAttendance, disabled, isOnLeave }: { student: Student & { todaysRecord?: AttendanceRecord }; onMarkAttendance: MarkAttendanceStudentListProps['onMarkAttendance'], disabled: boolean, isOnLeave: boolean }) => {
  const { toast } = useToast();
  const [reason, setReason] = React.useState('');
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  const handleLeaveSubmit = () => {
    if (!reason.trim()) {
      toast({
        variant: 'destructive',
        title: 'Reason required',
        description: 'Please provide a reason for the leave.',
      });
      return;
    }
    onMarkAttendance(student.registerNumber, 'present', reason);
    setReason('');
    setIsDialogOpen(false);
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setReason('');
    }
    setIsDialogOpen(open);
  }

  return (
    <AlertDialog open={isDialogOpen} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>
         <Button 
            size="sm" 
            variant="outline"
            className={cn(
                "w-[110px]",
                isOnLeave 
                    ? 'bg-yellow-500 text-white hover:bg-yellow-600 border-yellow-600'
                    : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-300 dark:bg-yellow-900/50 dark:text-yellow-300 dark:hover:bg-yellow-900 dark:border-yellow-700'
                )} 
            disabled={disabled}>
            <FileClock className="mr-2 h-4 w-4" /> On Leave
         </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
          <AlertDialogHeader>
              <AlertDialogTitle>Mark Leave for {student.name}</AlertDialogTitle>
              <AlertDialogDescription>
                  This will mark the student as present but on leave. Please provide a reason below.
                   {isOnLeave && student.todaysRecord?.reason && (
                    <div className="mt-4 rounded-md border border-yellow-200 bg-yellow-50 p-3 text-yellow-900 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-200">
                        <p className="font-bold text-sm">Current reason:</p>
                        <p className="text-sm">{student.todaysRecord.reason}</p>
                    </div>
                  )}
              </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-2">
              <Label htmlFor={`reason-${student.registerNumber}`}>Leave Reason</Label>
              <Textarea 
                  id={`reason-${student.registerNumber}`}
                  placeholder="e.g., Medical appointment, family function" 
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
              />
          </div>
          <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleLeaveSubmit}>Submit</AlertDialogAction>
          </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export function MarkAttendanceStudentList({ students, allDepartmentRecords, onMarkAttendance }: MarkAttendanceStudentListProps) {
  const { user } = useAuth();
  const today = React.useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);
  const isTeacher = user?.role === 'teacher';

  if (students.length === 0) {
    return <div className="text-center text-muted-foreground p-8">No students found for this semester.</div>;
  }

  return (
    <div className="space-y-4">
      {students.sort((a, b) => a.name.localeCompare(b.name)).map(student => {
        
        const todaysRecord = allDepartmentRecords
          .filter(r => r.date === today && r.studentRegister === student.registerNumber)
          .sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

        const isPresent = todaysRecord?.status === 'present' && !todaysRecord.reason;
        const isAbsent = todaysRecord?.status === 'absent';
        const isOnLeave = todaysRecord?.status === 'present' && !!todaysRecord.reason;

        const studentWithRecord = {...student, todaysRecord};

        const studentOverallRecords = allDepartmentRecords.filter(r => r.studentRegister === student.registerNumber);
        const allWorkingDayStrings = new Set(allDepartmentRecords.map(r => r.date));
        const enrollmentDayStart = new Date(student.createdAt);
        enrollmentDayStart.setHours(0, 0, 0, 0);
        const studentWorkingDays = Array.from(allWorkingDayStrings).filter(dateStr => new Date(`${dateStr}T00:00:00`) >= enrollmentDayStart);
        const totalDays = studentWorkingDays.length;
        const presentAndOnLeaveDays = new Set(studentOverallRecords.filter(r => r.status === 'present').map(r => r.date)).size;
        
        let percentage = totalDays > 0 ? Math.round((presentAndOnLeaveDays / totalDays) * 100) : 100;
        const overallAttendancePercentage = percentage > 100 ? 100 : percentage;
        
        const getIndicatorColor = (p: number) => {
          if (p >= 75) return 'bg-green-500';
          if (p >= 45) return 'bg-orange-500';
          return 'bg-red-500';
        };

        return (
          <div key={student.registerNumber} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <Avatar className="h-12 w-12">
                <AvatarImage src={student.profilePhotoUrl} alt={student.name} />
                <AvatarFallback>{getInitials(student.name)}</AvatarFallback>
              </Avatar>
              <div className='flex-1 truncate'>
                <p className="font-semibold truncate">{student.name}</p>
                <p className="text-sm text-muted-foreground">{student.registerNumber}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Progress value={overallAttendancePercentage} className="h-2 w-20" indicatorClassName={getIndicatorColor(overallAttendancePercentage)} />
                  <span className="text-xs font-medium text-muted-foreground">{overallAttendancePercentage}%</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0 ml-4">
              <Button 
                size="sm" 
                variant="outline" 
                className={cn(
                    "w-[110px]",
                    isPresent && 'bg-green-600 text-white hover:bg-green-700 border-green-700',
                    !isPresent && 'bg-green-100 text-green-800 hover:bg-green-200 border-green-300 dark:bg-green-900/50 dark:text-green-300 dark:hover:bg-green-900 dark:border-green-700'
                )} 
                onClick={() => onMarkAttendance(student.registerNumber, 'present')} 
                disabled={!isTeacher}
              >
                  <CheckCircle className="mr-2 h-4 w-4" /> Present
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className={cn(
                    "w-[110px]",
                    isAbsent && 'bg-red-600 text-white hover:bg-red-700 border-red-700',
                    !isAbsent && 'bg-red-100 text-red-800 hover:bg-red-200 border-red-300 dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-900 dark:border-red-700'
                )}
                onClick={() => onMarkAttendance(student.registerNumber, 'absent')} 
                disabled={!isTeacher}
              >
                  <XCircle className="mr-2 h-4 w-4" /> Absent
              </Button>
              <MarkLeaveButton student={studentWithRecord} onMarkAttendance={onMarkAttendance} disabled={!isTeacher} isOnLeave={isOnLeave} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
