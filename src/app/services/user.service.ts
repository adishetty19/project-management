import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private users: User[] = [
    { id: 'manager@example.com', name: 'Alice', email: 'manager@example.com', role: 'Manager' },
    { id: 'member@example.com', name: 'Bob', email: 'member@example.com', role: 'Member' }
  ];
  private usersSubject: BehaviorSubject<User[]> = new BehaviorSubject<User[]>(this.users);

  getUsers(): Observable<User[]> {
    return this.usersSubject.asObservable();
  }

  getUserByEmail(email: string): User | undefined {
    return this.users.find(u => u.email === email);
  }

  updateUser(user: User): void {
    const index = this.users.findIndex(u => u.email === user.email);
    if(index !== -1){
      this.users[index] = user;
    } else {
      this.users.push(user);
    }
    this.usersSubject.next(this.users);
  }
}
