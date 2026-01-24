export interface UserDto {
    username: string;
    role: number; // 0=Admin, 1=Waiter, 2=Kitchen, 3=Cashier
    roleName: string;
    token: string;
}

export enum UserRole {
    Admin = 0,
    Waiter = 1,
    Kitchen = 2,
    Cashier = 3
}
