import { Routes } from '@angular/router';
import { LoginComponent } from './login/login';
import { StudentEventsComponent } from './student-events/student-events';
import { CalendarComponent } from './calendar/calendar';
import { MyRegistrationsComponent } from './my-registrations/my-registrations';
import { EventOverviewComponent } from './event-overview/event-overview';
import { AdminComponent } from './admin/admin';
import { EventChatPageComponent } from './event-chat/event-chat-page';
import { authGuard, loginGuard, roleGuard } from './route-guards';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [loginGuard]
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'events'
  },
  {
    path: 'events',
    component: StudentEventsComponent,
    canActivate: [authGuard]
  },
  {
    path: 'calendar',
    component: CalendarComponent,
    canActivate: [authGuard]
  },
  {
    path: 'my-registrations',
    component: MyRegistrationsComponent,
    canActivate: [authGuard, roleGuard(['STUDENT'])]
  },
  {
    path: 'event-info',
    component: EventOverviewComponent,
    canActivate: [authGuard, roleGuard(['TEACHER', 'ADMIN'])]
  },
  {
    path: 'admin',
    component: AdminComponent,
    canActivate: [authGuard, roleGuard(['ADMIN'])]
  },
  {
    path: 'event-chat/:id',
    component: EventChatPageComponent,
    canActivate: [authGuard]
  },
  {
    path: '**',
    redirectTo: 'events'
  }
];
