'use client';

import React, {
  createContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react';
import { collection, onSnapshot, doc, setDoc, deleteDoc, query, where, getDocs, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { getStorage, ref, getDownloadURL, deleteObject, uploadBytes } from 'firebase/storage';
import { useFirestore, useFirebaseApp, useAuth as useFirebaseAuthHook, errorEmitter, FirestorePermissionError } from '@/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import type { Student, StudentsContextType } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { getImageHash, resizeAndCompressImage } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';

const ADMIN_EMAIL = "smart.admin@gmail.com";

export const StudentsContext = createContext<StudentsContextType | undefined>(
  undefined
);

export function StudentsProvider({ children }: { children: ReactNode }) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const firestore = useFirestore();
  const firebaseApp = useFirebaseApp();
  const auth = useFirebaseAuthHook();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!firestore || authLoading) {
      if (!authLoading) setLoading(false);
      return;
    }
    if (!user) {
      setStudents([]);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    let unsubscribe: () => void;

    if (user.role === 'student') {
      const studentDocRef = doc(firestore, 'students', user.registerNumber);
      unsubscribe = onSnapshot(studentDocRef, 
        (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            const studentData = {
              ...data,
              id: docSnap.id,
              registerNumber: docSnap.id,
              createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
              dateOfBirth: data.dateOfBirth?.toDate ? data.dateOfBirth.toDate() : new Date(data.dateOfBirth),
              updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : (data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt)),
            } as Student;
            setStudents([studentData]);
          } else {
            setStudents([]);
          }
          setLoading(false);
        },
        (err) => {
          const permissionError = new FirestorePermissionError({
            path: studentDocRef.path,
            operation: 'get'
          });
          errorEmitter.emit('permission-error', permissionError);
          setLoading(false);
        }
      );
    } else {
      let studentsQuery;
      const studentsCollection = collection(firestore, 'students');
      if (user.role === 'teacher' && user.department !== 'all') {
        studentsQuery = query(studentsCollection, where("department", "==", user.department));
      } else { // Admin or teacher with 'all' access
        studentsQuery = studentsCollection;
      }
      
      unsubscribe = onSnapshot(studentsQuery, 
        (snapshot) => {
          const studentData = snapshot.docs.map(doc => {
              const data = doc.data();
              return {
                  ...data,
                  id: doc.id,
                  registerNumber: doc.id,
                  createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
                  dateOfBirth: data.dateOfBirth?.toDate ? data.dateOfBirth.toDate() : new Date(data.dateOfBirth),
                  updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : (data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt)),
              } as Student;
          });
          setStudents(studentData);
          setLoading(false);
        },
        (err) => {
           const permissionError = new FirestorePermissionError({
            path: (studentsQuery as any)._query?.path?.canonicalString() || 'students',
            operation: 'list'
          });
          errorEmitter.emit('permission-error', permissionError);
          setLoading(false);
        }
      );
    }

    return () => unsubscribe();
  }, [firestore, user, authLoading]);

  const addStudent = useCallback(async (
    studentData: Omit<Student, 'profilePhotoUrl' | 'photoHash' | 'createdAt' | 'updatedAt'> & { photoFile: File }
  ) => {
    if (!firestore || !firebaseApp || !auth) {
        throw new Error('Firebase services not initialized.');
    }

    const { photoFile, ...details } = studentData;

    if (details.email.toLowerCase() === ADMIN_EMAIL) {
      throw new Error("This email is reserved for the administrator and cannot be used for a student.");
    }

    const studentDocRef = doc(firestore, 'students', details.registerNumber);
    const existingStudentSnap = await getDoc(studentDocRef);
    if (existingStudentSnap.exists()) {
        throw new Error(`A student with register number ${details.registerNumber} already exists.`);
    }
    
    const q = query(collection(firestore, "students"), where("email", "==", details.email));
    const emailSnap = await getDocs(q);
    if (!emailSnap.empty) {
        throw new Error(`A student with email ${details.email} already exists.`);
    }

    try {
        await createUserWithEmailAndPassword(auth, details.email, details.registerNumber);
    } catch (error: any) {
        if (error.code === 'auth/email-already-in-use') {
            throw new Error('This email is already in use by another account.');
        }
         if (error.code === 'auth/weak-password') {
            throw new Error('Password is too weak. It must be at least 6 characters.');
        }
        throw new Error(`Authentication error: ${error.message}`);
    }

    const initialStudentData = {
        ...details,
        profilePhotoUrl: '', 
        photoHash: '', 
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };
    
    setDoc(studentDocRef, initialStudentData).catch(error => {
      if (error.code === 'permission-denied') {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: studentDocRef.path, operation: 'create', requestResourceData: initialStudentData }));
      } else {
        toast({ variant: "destructive", title: "Database Error", description: error.message });
      }
    });

    (async () => {
        try {
            const storage = getStorage(firebaseApp);
            const photoRef = ref(storage, `students/${details.registerNumber}/profile.jpg`);

            const processedPhoto = await resizeAndCompressImage(photoFile);
            const photoHash = await getImageHash(processedPhoto);

            const duplicateQuery = query(collection(firestore, "students"), where("photoHash", "==", photoHash));
            const duplicateSnap = await getDocs(duplicateQuery);

            if (!duplicateSnap.empty && duplicateSnap.docs[0].id !== details.registerNumber) {
                const duplicateStudent = duplicateSnap.docs[0].data();
                throw new Error(`This photo is already enrolled for ${duplicateStudent.name}.`);
            }

            await uploadBytes(photoRef, processedPhoto);
            const downloadURL = await getDownloadURL(photoRef);
            
            const photoData = {
                profilePhotoUrl: downloadURL,
                photoHash: photoHash,
                updatedAt: serverTimestamp(),
            };

            updateDoc(studentDocRef, photoData).catch(error => {
              if (error.code === 'permission-denied') {
                errorEmitter.emit('permission-error', new FirestorePermissionError({ path: studentDocRef.path, operation: 'update', requestResourceData: photoData }));
              }
            });

        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Background Enrollment Failed",
                description: `Could not enroll photo for ${details.name}. Please try again from the student list. Reason: ${error.message}`,
                duration: 9000,
            });
        }
    })();
  }, [firestore, firebaseApp, auth, toast]);


  const updateStudent = useCallback((
    registerNumber: string,
    studentUpdate: Partial<Omit<Student, 'registerNumber' | 'email' | 'createdAt' | 'profilePhotoUrl' | 'photoHash' | 'updatedAt'>> & { newPhotoFile?: File }
  ) => {
    if (!firestore || !firebaseApp) {
      toast({ variant: "destructive", title: "Update Failed", description: "Database is not available." });
      return;
    }
    
    const { newPhotoFile, ...otherUpdates } = studentUpdate;
    const studentDocRef = doc(firestore, 'students', registerNumber);
    
    const updatesToApply: any = { ...otherUpdates, updatedAt: serverTimestamp() };
    
    updateDoc(studentDocRef, updatesToApply)
        .then(() => {
             toast({
                title: "Student Updated",
                description: `Details for ${otherUpdates.name || registerNumber} have been saved.`,
            });
        })
        .catch(error => {
            if (error.code === 'permission-denied') {
                errorEmitter.emit('permission-error', new FirestorePermissionError({ path: studentDocRef.path, operation: 'update', requestResourceData: updatesToApply }));
            } else {
                toast({ variant: "destructive", title: "Update Failed", description: error.message || "Could not save changes." });
            }
        });


    if (newPhotoFile) {
        (async () => {
            try {
                const storage = getStorage(firebaseApp);
                const photoRef = ref(storage, `students/${registerNumber}/profile.jpg`);

                const processedPhoto = await resizeAndCompressImage(newPhotoFile);
                const photoHash = await getImageHash(processedPhoto);
                
                const duplicateQuery = query(collection(firestore, "students"), where("photoHash", "==", photoHash));
                const duplicateSnap = await getDocs(duplicateQuery);
                if (!duplicateSnap.empty && duplicateSnap.docs[0].id !== registerNumber) {
                    const duplicateStudent = duplicateSnap.docs[0].data();
                    throw new Error(`This photo is already in use for ${duplicateStudent.name}.`);
                }
                
                await uploadBytes(photoRef, processedPhoto);
                const downloadURL = await getDownloadURL(photoRef);
                
                const photoData = {
                    profilePhotoUrl: downloadURL,
                    photoHash: photoHash,
                    updatedAt: serverTimestamp(),
                };
                
                updateDoc(studentDocRef, photoData)
                    .then(() => {
                         toast({
                            title: "Photo Updated",
                            description: `The new photo for ${otherUpdates.name || registerNumber} has been saved.`,
                        });
                    })
                    .catch(error => {
                        if (error.code === 'permission-denied') {
                            errorEmitter.emit('permission-error', new FirestorePermissionError({ path: studentDocRef.path, operation: 'update', requestResourceData: photoData }));
                        } else {
                           toast({ variant: "destructive", title: "Photo Update Failed", description: error.message });
                        }
                    });

            } catch (error: any) {
                toast({
                    variant: "destructive",
                    title: "Background Photo Update Failed",
                    description: error.message || "Could not save the new photo.",
                    duration: 9000,
                });
            }
        })();
    }
  }, [firestore, firebaseApp, toast]);
  
  const deleteStudent = useCallback((registerNumber: string) => {
    if (!firestore || !firebaseApp) {
      toast({ variant: 'destructive', title: 'Delete Failed', description: 'Database not available.' });
      return;
    }
    
    const studentToDelete = students.find(s => s.registerNumber === registerNumber);
    if (!studentToDelete) {
         toast({ variant: 'destructive', title: 'Delete Failed', description: 'Student not found.' });
         return;
    }

    const storage = getStorage(firebaseApp);
    const studentDocRef = doc(firestore, 'students', registerNumber);
    
    // Non-blocking delete from Firestore
    deleteDoc(studentDocRef)
        .then(() => {
            toast({
              title: "Student Deleted",
              description: `Successfully removed ${studentToDelete.name}.`,
            });
            // Background deletion from Storage
            if (studentToDelete.profilePhotoUrl) {
                const photoRef = ref(storage, `students/${registerNumber}/profile.jpg`);
                deleteObject(photoRef).catch(storageError => {
                    if (storageError.code !== 'storage/object-not-found') {
                        // Don't toast here, just log, as it's a background task.
                        console.error("Failed to delete student photo from storage:", storageError);
                    }
                });
            }
        })
        .catch(error => {
            if (error.code === 'permission-denied') {
                errorEmitter.emit('permission-error', new FirestorePermissionError({ path: studentDocRef.path, operation: 'delete' }));
            } else {
                 toast({ variant: "destructive", title: "Delete Failed", description: `Could not delete student. Error: ${error.message}` });
            }
        });
  }, [firestore, firebaseApp, toast, students]);

  const value = { students, setStudents, loading, addStudent, updateStudent, deleteStudent };

  return (
    <StudentsContext.Provider value={value}>
      {children}
    </StudentsContext.Provider>
  );
}
