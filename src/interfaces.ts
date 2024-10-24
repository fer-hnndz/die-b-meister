export interface PoolData {
    host: string;
    port: number;
    user: string;
    database: string;
    poolId: number;
}

export interface PoolRequestBody {
    host: string;
    user: string;
    password: string;
    port: number
    database: string;
}