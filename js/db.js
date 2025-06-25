const DB_NAME = 'CalorieTrackerDB';
const DB_VERSION = 3; // バージョンは据え置き (データ構造変更がないため)
const STORE_FOODS = 'foods';
const STORE_DISHES = 'dishes';

let db;

/**
 * IndexedDBをオープンまたは作成する (既存)
 */
function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_FOODS)) {
                db.createObjectStore(STORE_FOODS, { keyPath: 'id', autoIncrement: true });
                console.log(`Object store '${STORE_FOODS}' created.`);
            }
            if (!db.objectStoreNames.contains(STORE_DISHES)) {
                db.createObjectStore(STORE_DISHES, { keyPath: 'id', autoIncrement: true });
                console.log(`Object store '${STORE_DISHES}' created.`);
            }
            // データ移行ロジックは必要に応じてここに
            if (event.oldVersion < 3) {
                 console.log("Database upgraded to version 3.");
            }
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
 */
async function addFood(food) {
    if (!db) await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_FOODS], 'readwrite');
        const store = transaction.objectStore(STORE_FOODS);
        const request = store.add(food);
        request.onsuccess = () => { resolve(request.result); };
        request.onerror = (event) => { reject(event.target.error); };
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
        request.onsuccess = () => { resolve(request.result); };
        request.onerror = (event) => { reject(event.target.error); };
    });
}

/**
 * 特定のIDの食材を取得する (既存)
 */
async function getFoodById(id) {
    if (!db) await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_FOODS], 'readonly');
        const store = transaction.objectStore(STORE_FOODS);
        const request = store.get(id);
        request.onsuccess = () => { resolve(request.result); };
        request.onerror = (event) => { reject(event.target.error); };
    });
}

/**
 * 料理を保存する (既存)
 */
async function addDish(dish) {
    if (!db) await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_DISHES], 'readwrite');
        const store = transaction.objectStore(STORE_DISHES);
        const request = store.add(dish);
        request.onsuccess = () => { resolve(request.result); };
        request.onerror = (event) => { reject(event.target.error); };
    });
}

/**
 * すべての料理を取得する (既存)
 */
async function getAllDishes() {
    if (!db) await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_DISHES], 'readonly');
        const store = transaction.objectStore(STORE_DISHES);
        const request = store.getAll();
        request.onsuccess = () => { resolve(request.result); };
        request.onerror = (event) => { reject(event.target.error); };
    });
}

/**
 * 指定されたオブジェクトストアから指定されたIDのアイテムを削除する (新規追加)
 * @param {string} storeName - オブジェクトストアの名前 (例: 'foods', 'dishes')
 * @param {number} id - 削除するアイテムのID
 */
async function deleteItem(storeName, id) {
    if (!db) await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.delete(id); // deleteメソッドで削除

        request.onsuccess = () => {
            console.log(`Item with ID ${id} deleted from ${storeName}`);
            resolve();
        };

        request.onerror = (event) => {
            console.error(`Error deleting item with ID ${id} from ${storeName}:`, event.target.error);
            reject(event.target.error);
        };
    });
}


window.dbManager = {
    openDB,
    addFood,
    getAllFoods,
    getFoodById,
    addDish,
    getAllDishes,
    deleteItem // 追加
};