// RN copy. The web types these ids as mongoose `Types.ObjectId`. Here they are `string`, so the file compiles
// without mongoose. Nothing else is changed.

export interface Quotation {
    _id?: string; // optional when creating new quotations
    entityType: 0 | 1 | 2; // 0: LEAD, 1: CLIENT, 2: PROJECT
    entityId: string;
    title?: string;
    amount: number; // amount including GST
    url?: string;
    status?: number;
    uploadedBy?: string; // references User
    createdAt?: Date;
    updatedAt?: Date;
}