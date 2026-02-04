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

const LeaveReasonButton = ({ student, onMarkAttendance, disabled }: { student: Student & { todaysRecord?: AttendanceRecord }; onMarkAttendance: MarkAttendanceStudentListProps['onMarkAttendance'], disabled: boolean }) => {
  const { toast } = useToast();
  const [reason, setReason] = React.useState(student.todaysRecord?.reason || '');
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const hasReason = !!student.todaysRecord?.reason;

  const handleLeaveSubmit = () => {
    if (!reason.trim()) {
      toast({
        variant: 'destructive',
        title: 'Reason required',
        description: 'Please provide a reason for the leave.',
      });
      return;
    }
    // Always marks as present with a reason
    onMarkAttendance(student.registerNumber, 'present', reason);
    setIsDialogOpen(false);
  }
  
  const handleRemoveLeave = () => {
    // Marks as present without a reason
    onMarkAttendance(student.registerNumber, 'present');
    setReason('');
    setIsDialogOpen(false);
  }

  const handleOpenChange = (open: boolean) => {
    if (open) {
        setReason(student.todaysRecord?.reason || '');
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
                "w-auto px-3",
                hasReason && 'bg-yellow-500 text-white hover:bg-yellow-600 border-yellow-600'
            )} 
            disabled={disabled}>
            <FileClock className="mr-2 h-4 w-4" /> {hasReason ? "On Leave" : "Add Leave"}
         </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
          <AlertDialogHeader>
              <AlertDialogTitle>Manage Leave Reason for {student.name}</AlertDialogTitle>
              <AlertDialogDescription>
                  Providing a reason will mark the student as "On Leave". They will still be counted as present for attendance calculation purposes.
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
              {hasReason && <Button variant="outline" onClick={handleRemoveLeave}>Remove Leave</Button>}
              <AlertDialogAction onClick={handleLeaveSubmit}>Save Reason</AlertDialogAction>
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

        const isPresent = todaysRecord?.status === 'present';
        const isAbsent = todaysRecord?.status === 'absent';
        
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
              <LeaveReasonButton student={studentWithRecord} onMarkAttendance={onMarkAttendance} disabled={!isTeacher || !isPresent} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
