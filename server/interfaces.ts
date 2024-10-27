export interface PoolData {
    host: string;
    port: number;
    user: string;
    database: string;
    id: number;
}

export interface PoolRequestBody {
    host: string;
    user: string;
    password: string;
    port: number
    database: string;
}