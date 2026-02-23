'use client';

import React from 'react';
import type { Student, AttendanceRecord } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, FileClock, Info } from 'lucide-react';
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
} from "@/components/ui/dialog";
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
  onMarkAttendance: (studentRegister: string, status: 'present' | 'absent', subject: string, reason?: string) => void;
  subject: string;
}

const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
};

const LeaveReasonButton = ({ student, onMarkAttendance, subject, disabled }: { student: Student & { todaysRecord?: AttendanceRecord }; onMarkAttendance: MarkAttendanceStudentListProps['onMarkAttendance'], subject: string, disabled: boolean }) => {
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
    onMarkAttendance(student.registerNumber, 'present', subject, reason);
    setIsDialogOpen(false);
  }
  
  const handleRemoveLeave = () => {
    onMarkAttendance(student.registerNumber, 'present', subject);
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
            variant="ghost"
            className={cn(
                "h-12 w-12 p-0 rounded-full transition-all shadow-sm",
                hasReason ? 'bg-yellow-500 text-white hover:bg-yellow-600 shadow-md scale-110' : 'text-muted-foreground hover:bg-muted'
            )} 
            disabled={disabled}>
            <FileClock className="h-6 w-6" />
            <span className="sr-only">{hasReason ? "On Leave" : "Add Leave"}</span>
         </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
          <AlertDialogHeader>
              <AlertDialogTitle className="text-xl font-headline">Leave Reason: {student.name}</AlertDialogTitle>
              <AlertDialogDescription>
                  Marking a student as "On Leave" counts them as present for overall percentage calculations.
              </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-3 py-2">
              <Label htmlFor={`reason-${student.registerNumber}`} className="font-bold">Reason for Absence</Label>
              <Textarea 
                  id={`reason-${student.registerNumber}`}
                  placeholder="e.g., Medical emergency, personal emergency..." 
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="min-h-[100px]"
              />
          </div>
          <AlertDialogFooter className="gap-2">
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              {hasReason && <Button variant="destructive" onClick={handleRemoveLeave}>Remove Leave</Button>}
              <AlertDialogAction onClick={handleLeaveSubmit} className="bg-primary">Save Reason</AlertDialogAction>
          </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};


export function MarkAttendanceStudentList({ students, allDepartmentRecords, onMarkAttendance, subject }: MarkAttendanceStudentListProps) {
  const { user } = useAuth();
  const today = React.useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);
  const isTeacher = user?.role === 'teacher';

  if (students.length === 0) {
    return (
        <div className="text-center py-20 bg-muted/10 rounded-2xl border-2 border-dashed">
            <Info className="mx-auto h-12 w-12 text-muted-foreground opacity-20 mb-4" />
            <p className="text-muted-foreground font-semibold">No students found for this semester.</p>
        </div>
    );
  }

  return (
    <div className="grid gap-4">
      {students.sort((a, b) => a.name.localeCompare(b.name)).map(student => {
        
        const todaysRecord = allDepartmentRecords
          .filter(r => r.date === today && r.studentRegister === student.registerNumber && r.subject === subject)
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
          <div key={student.registerNumber} className="flex items-center gap-5 p-4 rounded-2xl bg-card border shadow-md hover:shadow-lg transition-all group border-primary/5">
            <Avatar className="h-24 w-24 border-4 border-background shadow-xl flex-shrink-0 ring-2 ring-primary/10 group-hover:ring-primary/30 transition-all">
                <AvatarImage src={student.profilePhotoUrl} alt={student.name} className="object-cover" />
                <AvatarFallback className="bg-primary/5 text-primary font-black text-3xl">{getInitials(student.name)}</AvatarFallback>
            </Avatar>
            
            <div className='flex-1 min-w-0'>
                <p className="text-2xl font-black text-foreground truncate group-hover:text-primary transition-colors leading-tight mb-0.5">{student.name}</p>
                <p className="text-xs font-code text-muted-foreground uppercase tracking-widest font-black opacity-70 mb-2">{student.registerNumber}</p>
                <div className="flex flex-col gap-1.5 max-w-[140px]">
                    <div className="flex items-center justify-between text-[10px] font-black text-muted-foreground uppercase">
                        <span>Attendance Rate</span>
                        <span className={cn("px-1 rounded", overallAttendancePercentage < 75 ? "text-red-500" : "text-green-600")}>{overallAttendancePercentage}%</span>
                    </div>
                    <Progress value={overallAttendancePercentage} className="h-2.5 rounded-full bg-muted shadow-inner" indicatorClassName={getIndicatorColor(overallAttendancePercentage)} />
                </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <Button 
                size="lg" 
                variant="outline" 
                className={cn(
                    "h-16 w-16 rounded-2xl border-2 transition-all font-black text-lg shadow-sm flex flex-col items-center justify-center p-0",
                    isPresent && 'bg-green-600 text-white border-green-600 hover:bg-green-700 hover:border-green-700 shadow-green-200 dark:shadow-none scale-105',
                    !isPresent && 'border-green-100 text-green-700 hover:bg-green-50 hover:border-green-300 dark:border-green-900/20'
                )} 
                onClick={() => onMarkAttendance(student.registerNumber, 'present', subject)} 
                disabled={!isTeacher || !subject}
              >
                  <CheckCircle className="h-7 w-7" />
                  <span className="text-[10px] uppercase font-black tracking-tighter mt-0.5">Present</span>
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className={cn(
                    "h-16 w-16 rounded-2xl border-2 transition-all font-black text-lg shadow-sm flex flex-col items-center justify-center p-0",
                    isAbsent && 'bg-red-600 text-white border-red-600 hover:bg-red-700 hover:border-red-700 shadow-red-200 dark:shadow-none scale-105',
                    !isAbsent && 'border-red-100 text-red-700 hover:bg-red-50 hover:border-red-300 dark:border-red-900/20'
                )}
                onClick={() => onMarkAttendance(student.registerNumber, 'absent', subject)} 
                disabled={!isTeacher || !subject}
              >
                  <XCircle className="h-7 w-7" />
                  <span className="text-[10px] uppercase font-black tracking-tighter mt-0.5">Absent</span>
              </Button>
              <LeaveReasonButton student={studentWithRecord} onMarkAttendance={onMarkAttendance} subject={subject} disabled={!isTeacher || !isPresent || !subject} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
