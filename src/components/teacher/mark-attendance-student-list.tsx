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
import { Progress } from '../ui/progress';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

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

const MarkLeaveButton = ({ student, onMarkAttendance }: { student: Student; onMarkAttendance: MarkAttendanceStudentListProps['onMarkAttendance'] }) => {
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
      setReason(''); // Reset reason when dialog is closed
    }
    setIsDialogOpen(open);
  }

  return (
    <AlertDialog open={isDialogOpen} onOpenChange={handleOpenChange}>
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

const StudentAttendanceRow = ({
  student,
  todaysRecord,
  overallAttendancePercentage,
  onMarkAttendance,
}: {
  student: Student;
  todaysRecord: AttendanceRecord | undefined;
  overallAttendancePercentage: number;
  onMarkAttendance: MarkAttendanceStudentListProps['onMarkAttendance'];
}) => {
  const getIndicatorColor = (p: number) => {
    if (p >= 75) return 'bg-green-500';
    if (p >= 45) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
      <div className="flex items-center gap-4">
        <Avatar className="h-12 w-12">
          <AvatarImage src={student.profilePhotoUrl} alt={student.name} />
          <AvatarFallback>{getInitials(student.name)}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold">{student.name}</p>
          <p className="text-sm text-muted-foreground">{student.registerNumber}</p>
          <div className="flex items-center gap-2 mt-2">
            <Progress value={overallAttendancePercentage} className="h-2 w-20" indicatorClassName={getIndicatorColor(overallAttendancePercentage)} />
            <span className="text-xs font-medium text-muted-foreground">{overallAttendancePercentage}%</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {todaysRecord ? (
          <div className={cn(
            "flex items-center justify-start gap-2 rounded-md px-3 py-2 w-full max-w-48 text-sm font-semibold",
            {
              'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300': todaysRecord.status === 'present' && !todaysRecord.reason,
              'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300': todaysRecord.status === 'absent',
              'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300': !!todaysRecord.reason,
            }
          )}>
            {todaysRecord.status === 'present' && !todaysRecord.reason && <Check className="h-4 w-4 flex-shrink-0" />}
            {todaysRecord.status === 'absent' && <X className="h-4 w-4 flex-shrink-0" />}
            {todaysRecord.reason && <LogOut className="h-4 w-4 flex-shrink-0" />}
            <div className="flex flex-col text-left">
              <span>{todaysRecord.reason ? 'On Leave' : todaysRecord.status.charAt(0).toUpperCase() + todaysRecord.status.slice(1)}</span>
              {todaysRecord.reason && (
                <span className="text-xs font-normal italic">{todaysRecord.reason}</span>
              )}
            </div>
          </div>
        ) : (
          <>
            <Button size="sm" variant="outline" className="bg-green-100 text-green-800 hover:bg-green-200 border-green-300 dark:bg-green-900/50 dark:text-green-300 dark:hover:bg-green-900 dark:border-green-700" onClick={() => onMarkAttendance(student.registerNumber, 'present')}>
              <Check className="mr-2 h-4 w-4" /> Present
            </Button>
            <Button size="sm" variant="outline" className="bg-red-100 text-red-800 hover:bg-red-200 border-red-300 dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-900 dark:border-red-700" onClick={() => onMarkAttendance(student.registerNumber, 'absent')}>
              <X className="mr-2 h-4 w-4" /> Absent
            </Button>
            <MarkLeaveButton student={student} onMarkAttendance={onMarkAttendance} />
          </>
        )}
      </div>
    </div>
  );
};

export function MarkAttendanceStudentList({ students, allDepartmentRecords, onMarkAttendance }: MarkAttendanceStudentListProps) {
  const today = React.useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);

  const getStudentData = React.useCallback((student: Student) => {
    // Find today's record for this student
    const todaysRecord = allDepartmentRecords.find(r => r.date === today && r.studentRegister === student.registerNumber);
    
    // Calculate overall attendance percentage
    const studentOverallRecords = allDepartmentRecords.filter(r => r.studentRegister === student.registerNumber);
    const allWorkingDayStrings = new Set(allDepartmentRecords.map(r => r.date));
    const enrollmentDayStart = new Date(student.createdAt);
    enrollmentDayStart.setHours(0, 0, 0, 0);

    const studentWorkingDays = Array.from(allWorkingDayStrings).filter(dateStr => {
        const recordDate = new Date(`${dateStr}T00:00:00`);
        return recordDate >= enrollmentDayStart;
    });

    const totalDays = studentWorkingDays.length;

    const presentAndOnLeaveDays = new Set(
        studentOverallRecords
            .filter(r => r.status === 'present')
            .map(r => r.date)
    ).size;
    
    let percentage = 100;
    if (totalDays > 0) {
        percentage = Math.round((presentAndOnLeaveDays / totalDays) * 100);
    }
    
    const overallAttendancePercentage = percentage > 100 ? 100 : percentage;

    return { todaysRecord, overallAttendancePercentage };
  }, [allDepartmentRecords, today]);


  if (students.length === 0) {
    return <div className="text-center text-muted-foreground p-8">No students found for this semester.</div>;
  }

  return (
    <div className="space-y-4">
      {students.sort((a, b) => a.name.localeCompare(b.name)).map(student => {
        const { todaysRecord, overallAttendancePercentage } = getStudentData(student);
        return (
          <StudentAttendanceRow
            key={student.registerNumber}
            student={student}
            todaysRecord={todaysRecord}
            overallAttendancePercentage={overallAttendancePercentage}
            onMarkAttendance={onMarkAttendance}
          />
        );
      })}
    </div>
  );
}
