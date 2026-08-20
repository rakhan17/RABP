process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import('firebase/app').then(({initializeApp}) => 
import('firebase/firestore').then(async ({getFirestore, collection, getDocs}) => {
  const app = initializeApp({apiKey: 'AIzaSyDC87zcVFkhL3xvGV8_ArXgLHa4OdYO7P0', projectId: 'rabp-473e4'});
  const db = getFirestore(app);
  const [spp, spm, sp2d] = await Promise.all([getDocs(collection(db, 'spp_data')), getDocs(collection(db, 'spm_data')), getDocs(collection(db, 'sp2d_data'))]);
  const sppData = spp.docs.map(d=>d.data());
  const spmData = spm.docs.map(d=>d.data());
  const sp2dData = sp2d.docs.map(d=>d.data());
  
  const map = new Map();
  const getKey = (k,n) => `${(k||'').trim().toLowerCase()}_${(n||'').trim().toLowerCase()}`;
  
  sppData.forEach(s => {
    const key = getKey(s.keterangan, s.namaPenerima);
    map.set(key, { ...s });
  });
  
  spmData.forEach(s => {
    const key = getKey(s.keterangan, s.namaPenerima);
    const ex = map.get(key) || { ...s };
    ex.unitSkpd = ex.unitSkpd || s.unitSkpd;
    map.set(key, ex);
  });
  
  sp2dData.forEach(s => {
    const key = getKey(s.keterangan, s.namaPenerima);
    const ex = map.get(key) || { ...s };
    ex.unitSkpd = ex.unitSkpd || s.unitSkpd;
    map.set(key, ex);
  });
  
  console.log(JSON.stringify(Array.from(map.values()).slice(0, 5).map(x => ({
    ket: x.keterangan.substring(0, 30),
    nama: x.namaPenerima,
    unit: x.unitSkpd
  })), null, 2));
}));
