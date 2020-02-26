import * as admin from 'firebase-admin';
import * as fireorm from 'fireorm';
import { Collection, getBaseRepository } from 'fireorm';

const serviceAccount = require('./config/airy-charmer.credentials.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`,
});

const firestore = admin.firestore();
firestore.settings({
    timestampsInSnapshots: true,
});
fireorm.initialize(firestore);



@Collection()
class Todo {
    id: string;
    text: string;
    done: Boolean;
}
const todoRepository = getBaseRepository(Todo, firestore);

const todo = new Todo();
todo.text = "Check fireorm's Github Repository";
todo.done = false;

const todoDocument = todoRepository.create(todo); // Create todo
//const mySuperTodoDocument = await todoRepository.findById(todoDocument.id); // Read todo
//await todoRepository.update(mySuperTodoDocument); // Update todo