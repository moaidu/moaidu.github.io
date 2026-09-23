import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { readFileSync } from 'fs';
import { doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
const env = await initializeTestEnvironment({ projectId: 'demo-mathspeak',
  storage: { rules: readFileSync('../storage.rules', 'utf8'), host: '127.0.0.1', port: 9199 },
  firestore: { rules: readFileSync('../firestore.rules', 'utf8'), host: '127.0.0.1', port: 8085 } });
await env.withSecurityRulesDisabled(async ctx => { await setDoc(doc(ctx.firestore(), 'academies/tA/members/anon1'), { classId: 'c1' }); });
const B = 'demo-mathspeak.appspot.com';
const stu = env.authenticatedContext('anon1').storage(B);
const stranger = env.authenticatedContext('anon2').storage(B);
const teacher = env.authenticatedContext('tA').storage(B);
const otherTeacher = env.authenticatedContext('tB').storage(B);
const img = new Uint8Array([1, 2, 3]);
const res = [];
async function t(name, expectOk, p){ let ok; try { await p; ok = true; } catch(e){ ok = false; } res.push([ok === expectOk ? 'PASS' : 'FAIL', name]); }
await t('등록된 학생: 내 폴더에 사진 업로드', true, uploadBytes(ref(stu, 'academies/tA/submissions/anon1/1.jpg'), img, { contentType: 'image/jpeg' }));
await t('등록된 학생: 영상 업로드', true, uploadBytes(ref(stu, 'academies/tA/submissions/anon1/1.webm'), img, { contentType: 'video/webm' }));
await t('등록된 학생: 남의 폴더 업로드 불가', false, uploadBytes(ref(stu, 'academies/tA/submissions/anon2/1.jpg'), img, { contentType: 'image/jpeg' }));
await t('등록된 학생: 이미지/영상 외 파일 불가', false, uploadBytes(ref(stu, 'academies/tA/submissions/anon1/x.html'), img, { contentType: 'text/html' }));
await t('등록 안 된 기기: 업로드 불가', false, uploadBytes(ref(stranger, 'academies/tA/submissions/anon2/1.jpg'), img, { contentType: 'image/jpeg' }));
await t('학생: 내 파일 URL 받기', true, getDownloadURL(ref(stu, 'academies/tA/submissions/anon1/1.jpg')));
await t('다른 학생: 남의 파일 URL 불가', false, getDownloadURL(ref(stranger, 'academies/tA/submissions/anon1/1.jpg')));
await t('선생님: 학생 파일 URL 받기', true, getDownloadURL(ref(teacher, 'academies/tA/submissions/anon1/1.jpg')));
await t('다른 학원 선생님: 불가', false, getDownloadURL(ref(otherTeacher, 'academies/tA/submissions/anon1/1.jpg')));
res.forEach(r => console.log(r.join(' | ')));
console.log(res.some(r => r[0] === 'FAIL') ? 'SOME FAILED' : `ALL ${res.length} STORAGE RULE TESTS PASSED`);
await env.cleanup();
