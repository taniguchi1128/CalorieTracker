const DB_NAME = 'CalorieTrackerDB';
const DB_VERSION = 2; // バージョンを上げる！
const STORE_FOODS = 'foods';
const STORE_DISHES = 'dishes'; // 新しく追加

let db;

/**
 * IndexedDBをオープンまたは作成する
 */
function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            db = event.target.result;
            // 食材ストアの作成 (既存)
            if (!db.objectStoreNames.contains(STORE_FOODS)) {
                db.createObjectStore(STORE_FOODS, { keyPath: 'id', autoIncrement: true });
                console.log(`Object store '${STORE_FOODS}' created.`);
            }
            // 料理ストアの作成 (新規)
            if (!db.objectStoreNames.contains(STORE_DISHES)) {
                db.createObjectStore(STORE_DISHES, { keyPath: 'id', autoIncrement: true });
                console.log(`Object store '${STORE_DISHES}' created.`);
            }
            // 他のオブジェクトストア (食事記録) もここに追加
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            console.log('IndexedDB opened successfully:', DB_NAME);
            resolve(db);
        };

        request.onerror = (event) => {
            console.error('Error opening IndexedDB:', event.target.errorCode);
            reject(event.target.errorCode);
        };
    });
}

/**
 * 食材を保存する (既存)
 * @param {object} food - 保存する食材データ
 */
async function addFood(food) {
    if (!db) await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_FOODS], 'readwrite');
        const store = transaction.objectStore(STORE_FOODS);
        const request = store.add(food);

        request.onsuccess = () => {
            console.log('Food added:', food);
            resolve(request.result);
        };

        request.onerror = (event) => {
            console.error('Error adding food:', event.target.error);
            reject(event.target.error);
        };
    });
}

/**
 * すべての食材を取得する (既存)
 */
async function getAllFoods() {
    if (!db) await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_FOODS], 'readonly');
        const store = transaction.objectStore(STORE_FOODS);
        const request = store.getAll();

        request.onsuccess = () => {
            console.log('All foods retrieved:', request.result);
            resolve(request.result);
        };

        request.onerror = (event) => {
            console.error('Error getting all foods:', event.target.error);
            reject(event.target.error);
        };
    });
}

/**
 * 特定のIDの食材を取得する (新規追加)
 * 料理のPFC計算時に必要
 * @param {number} id - 食材のID
 */
async function getFoodById(id) {
    if (!db) await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_FOODS], 'readonly');
        const store = transaction.objectStore(STORE_FOODS);
        const request = store.get(id);

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onerror = (event) => {
            console.error(`Error getting food with ID ${id}:`, event.target.error);
            reject(event.target.error);
        };
    });
}


/**
 * 料理を保存する (新規追加)
 * @param {object} dish - 保存する料理データ
 */
async function addDish(dish) {
    if (!db) await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_DISHES], 'readwrite');
        const store = transaction.objectStore(STORE_DISHES);
        const request = store.add(dish);

        request.onsuccess = () => {
            console.log('Dish added:', dish);
            resolve(request.result);
        };

        request.onerror = (event) => {
            console.error('Error adding dish:', event.target.error);
            reject(event.target.error);
        };
    });
}

/**
 * すべての料理を取得する (新規追加)
 */
async function getAllDishes() {
    if (!db) await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_DISHES], 'readonly');
        const store = transaction.objectStore(STORE_DISHES);
        const request = store.getAll();

        request.onsuccess = () => {
            console.log('All dishes retrieved:', request.result);
            resolve(request.result);
        };

        request.onerror = (event) => {
            console.error('Error getting all dishes:', event.target.error);
            reject(event.target.error);
        };
    });
}


window.dbManager = {
    openDB,
    addFood,
    getAllFoods,
    getFoodById, // 追加
    addDish,     // 追加
    getAllDishes // 追加
};