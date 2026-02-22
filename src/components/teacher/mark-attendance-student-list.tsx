
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
                "h-8 w-8 p-0 rounded-full",
                hasReason ? 'bg-yellow-500 text-white hover:bg-yellow-600' : 'text-muted-foreground hover:bg-muted'
            )} 
            disabled={disabled}>
            <FileClock className="h-4 w-4" />
            <span className="sr-only">{hasReason ? "On Leave" : "Add Leave"}</span>
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


export function MarkAttendanceStudentList({ students, allDepartmentRecords, onMarkAttendance, subject }: MarkAttendanceStudentListProps) {
  const { user } = useAuth();
  const today = React.useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);
  const isTeacher = user?.role === 'teacher';

  if (students.length === 0) {
    return (
        <div className="text-center py-16 bg-muted/20 rounded-xl border-2 border-dashed">
            <Info className="mx-auto h-10 w-10 text-muted-foreground mb-4" />
            <p className="text-muted-foreground font-medium">No students found for this semester.</p>
        </div>
    );
  }

  return (
    <div className="grid gap-3">
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
          <div key={student.registerNumber} className="flex items-center gap-4 p-3 rounded-xl bg-card border shadow-sm hover:shadow-md transition-all group">
            <Avatar className="h-14 w-14 border-2 border-muted shadow-sm flex-shrink-0">
                <AvatarImage src={student.profilePhotoUrl} alt={student.name} className="object-cover" />
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">{getInitials(student.name)}</AvatarFallback>
            </Avatar>
            
            <div className='flex-1 min-w-0'>
                <p className="font-bold text-foreground truncate group-hover:text-primary transition-colors">{student.name}</p>
                <p className="text-[10px] font-code text-muted-foreground uppercase tracking-wider">{student.registerNumber}</p>
                <div className="flex items-center gap-2 mt-1.5">
                    <Progress value={overallAttendancePercentage} className="h-1.5 w-16" indicatorClassName={getIndicatorColor(overallAttendancePercentage)} />
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">{overallAttendancePercentage}% Rate</span>
                </div>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              <Button 
                size="sm" 
                variant="outline" 
                className={cn(
                    "h-9 px-3 rounded-lg border-2 transition-all font-bold text-xs uppercase tracking-tight",
                    isPresent && 'bg-green-600 text-white border-green-600 hover:bg-green-700 hover:border-green-700',
                    !isPresent && 'border-green-100 text-green-700 hover:bg-green-50 hover:border-green-200 dark:border-green-900/30'
                )} 
                onClick={() => onMarkAttendance(student.registerNumber, 'present', subject)} 
                disabled={!isTeacher || !subject}
              >
                  <CheckCircle className="mr-1.5 h-3.5 w-3.5" /> P
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className={cn(
                    "h-9 px-3 rounded-lg border-2 transition-all font-bold text-xs uppercase tracking-tight",
                    isAbsent && 'bg-red-600 text-white border-red-600 hover:bg-red-700 hover:border-red-700',
                    !isAbsent && 'border-red-100 text-red-700 hover:bg-red-50 hover:border-red-200 dark:border-red-900/30'
                )}
                onClick={() => onMarkAttendance(student.registerNumber, 'absent', subject)} 
                disabled={!isTeacher || !subject}
              >
                  <XCircle className="mr-1.5 h-3.5 w-3.5" /> A
              </Button>
              <LeaveReasonButton student={studentWithRecord} onMarkAttendance={onMarkAttendance} subject={subject} disabled={!isTeacher || !isPresent || !subject} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
