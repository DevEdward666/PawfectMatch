import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminTabsPage } from './admin-tabs.page';

const routes: Routes = [
  {
    path: '',
    component: AdminTabsPage,
    children: [
      {
        path: 'dashboard',
        loadChildren: () => import('../dashboard/dashboard.module').then(m => m.DashboardPageModule)
      },
      {
        path: 'pets',
        loadChildren: () => import('../pet-management/pet-management.module').then(m => m.PetManagementPageModule)
      },
      {
        path: 'products',
        loadChildren: () => import('../product-management/product-management.module').then(m => m.ProductManagementPageModule)
      },
      {
        path: 'users',
        loadChildren: () => import('../user-management/user-management.module').then(m => m.UserManagementPageModule)
      },
      {
        path: 'reports',
        loadChildren: () => import('../report-management/report-management.module').then(m => m.ReportManagementPageModule)
      },
      {
        path: 'messages',
        loadChildren: () => import('../message-management/message-management.module').then(m => m.MessageManagementPageModule)
      },
      {
        path: '',
        redirectTo: '/admin/dashboard',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: '',
    redirectTo: '/admin/dashboard',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminTabsPageRoutingModule {}
