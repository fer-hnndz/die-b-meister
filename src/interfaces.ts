export interface PoolData {
    name: string;
    host: string;
    port: number;
    user: string;
    pass?: string;
    db: string;
    poolId: number;
}