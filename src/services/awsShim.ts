/**
 * AWS Shim - replaces Firebase Shim
 * Provides empty/mock implementations to satisfy existing components
 * that were relying directly on Firebase APIs instead of the abstracted API Gateway.
 */

export const collection = (...args: any[]) => ({ type: 'collection', args });
export const doc = (...args: any[]) => ({ type: 'doc', args });
export const getDocs = async (...args: any[]) => {
    console.log('Mocked getDocs called', args);
    return { docs: [] as any[], empty: true, size: 0, forEach: (cb: any) => { } };
};
export const getDoc = async (...args: any[]) => {
    console.log('Mocked getDoc called', args);
    return { exists: () => false, data: (): any => ({}), id: 'mock-id' };
};
export const addDoc = async (...args: any[]) => {
    console.log('Mocked addDoc called', args);
    return { id: 'mock-id' };
};
export const deleteDoc = async (...args: any[]) => {
    console.log('Mocked deleteDoc called', args);
};
export const updateDoc = async (...args: any[]) => {
    console.log('Mocked updateDoc called', args);
};
export const setDoc = async (...args: any[]) => {
    console.log('Mocked setDoc called', args);
};
export const query = (...args: any[]) => ({ type: 'query', args });
export const where = (...args: any[]) => ({ type: 'where', args });
export const orderBy = (...args: any[]) => ({ type: 'orderBy', args });
export const limit = (...args: any[]) => ({ type: 'limit', args });
export const serverTimestamp = () => Timestamp.now();
export const deleteField = () => undefined;
export const writeBatch = (...args: any[]) => {
    return {
        set: (...args: any[]) => { },
        update: (...args: any[]) => { },
        delete: (...args: any[]) => { },
        commit: async (...args: any[]) => {
            console.log('Mocked batch commit called');
        }
    };
};
export const httpsCallable = (functions: any, name: string) => async (data: any) => {
    console.log('Mocked httpsCallable called', name, data);
    return { data: {} };
};

// Mock Firebase Auth
export const deleteUser = async (user: any) => {
    console.log('Mocked deleteUser called', user);
};

export const EmailAuthProvider = {
    credential: (email: string, pass: string) => ({ email, pass })
};

export const reauthenticateWithCredential = async (user: any, cred: any) => {
    console.log('Mocked reauthenticate called');
};

export interface Timestamp {
    toMillis(): number;
    toDate(): Date;
}

export const Timestamp = {
    now: (): Timestamp => ({
        toMillis: () => Date.now(),
        toDate: () => new Date()
    }),
    fromDate: (date: Date): Timestamp => ({
        toMillis: () => date.getTime(),
        toDate: () => date
    })
};
