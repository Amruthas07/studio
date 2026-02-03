'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, UserPlus } from "lucide-react";
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, PlusCircle } from "lucide-react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AddStudentForm } from "@/components/admin/add-student-form";
import React from "react";
import { AddTeacherForm } from "@/components/admin/add-teacher-form";
import { useStudents } from "@/hooks/use-students";
import { useTeachers } from "@/hooks/use-teachers";
import { AnalyticsChart } from "@/components/admin/analytics-chart";

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const { students, loading: studentsLoading } = useStudents();
  const { teachers, loading: teachersLoading } = useTeachers();

  const [isAddStudentDialogOpen, setIsAddStudentDialogOpen] = React.useState(false);
  const [isAddTeacherDialogOpen, setIsAddTeacherDialogOpen] = React.useState(false);

  const loading = authLoading || studentsLoading || teachersLoading;

  if (loading || !user) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
           <h1 className="text-3xl font-bold tracking-tight font-headline">
            Admin Dashboard
          </h1>
          <p className="text-foreground">
            Overview of the system and management tools.
          </p>
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students.length}</div>
            <p className="text-xs text-muted-foreground">Currently enrolled in the system</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teachers.length}</div>
            <p className="text-xs text-muted-foreground">Currently employed in the system</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Student Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline"><Users /> Student Management</CardTitle>
            <CardDescription>
              Add a new student to a department, enroll their photo, and manage their records.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Dialog open={isAddStudentDialogOpen} onOpenChange={setIsAddStudentDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add New Student
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[625px]">
                <DialogHeader>
                  <DialogTitle className="font-headline text-2xl">Add New Student</DialogTitle>
                  <DialogDescription>
                    Fill in the details below and upload a profile photo to enroll a new student.
                  </DialogDescription>
                </DialogHeader>
                <AddStudentForm onStudentAdded={() => setIsAddStudentDialogOpen(false)} />
              </DialogContent>
            </Dialog>
            <Button variant="outline" asChild>
                <Link href="/admin/students">View All Students</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Teacher Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline"><UserPlus /> Teacher Management</CardTitle>
            <CardDescription>
              Add a new teacher to a department and set their credentials for system access.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
              <Dialog open={isAddTeacherDialogOpen} onOpenChange={setIsAddTeacherDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add New Teacher
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[525px]">
                  <DialogHeader>
                    <DialogTitle className="font-headline text-2xl">Add New Teacher</DialogTitle>
                    <DialogDescription>
                      Fill in the details below to create a new teacher account.
                    </DialogDescription>
                  </DialogHeader>
                  <AddTeacherForm onTeacherAdded={() => setIsAddTeacherDialogOpen(false)} />
                </DialogContent>
              </Dialog>
            <Button variant="outline" asChild>
              <Link href="/admin/teachers">View All Teachers</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div>
        <AnalyticsChart students={students} teachers={teachers} />
      </div>
    </div>
  );
}
