import { Puppet } from './puppet.model';
import { Novel } from './novel.model';
import { Chapter } from './chapter.model'
const { Firestore } = require('@google-cloud/firestore');
const { FieldValue } = require('firebase-admin').firestore;

const db = new Firestore({
    projectId: 'airy-charmer-259211',
    keyFilename: './config/airy-charmer.credentials.json',
})

export { db, Novel, Puppet, FieldValue };