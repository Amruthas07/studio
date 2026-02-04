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
  attendanceRecords: AttendanceRecord[];
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


export function MarkAttendanceStudentList({ students, attendanceRecords, onMarkAttendance }: MarkAttendanceStudentListProps) {
  
  if (students.length === 0) {
    return <div className="text-center text-muted-foreground p-8">No students found for this semester.</div>;
  }

  return (
    <div className="space-y-4">
      {students.sort((a, b) => a.name.localeCompare(b.name)).map(student => {
        const record = attendanceRecords.find(r => r.studentRegister === student.registerNumber);
        
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
                <Badge variant={record.reason ? 'secondary' : record.status === 'present' ? 'default' : 'destructive'} className="text-base">
                    {record.status === 'present' && !record.reason && <Check className="mr-2 h-4 w-4"/>}
                    {record.reason && <LogOut className="mr-2 h-4 w-4"/>}
                    {record.status === 'absent' && <X className="mr-2 h-4 w-4"/>}
                    Status: {record.reason ? 'On Leave' : record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                </Badge>
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
        )
      })}
    </div>
  );
}
