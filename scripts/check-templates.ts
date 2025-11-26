/**
 * Script para verificar las plantillas en la BD
 */

import { MongoClient } from 'mongodb';

const MONGODB_URI = 'mongodb+srv://MatiRivas_cluster:matiasrivas1@cluster0.2rxdxu8.mongodb.net/Notificaciones';

async function checkTemplates() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB\n');
    
    const db = client.db('Notificaciones');
    const templatesCollection = db.collection('plantillas');
    
    // Obtener todas las plantillas
    const templates = await templatesCollection.find({}).sort({ id_Plantilla: 1 }).toArray();
    
    console.log(`📋 Total de plantillas encontradas: ${templates.length}\n`);
    
    if (templates.length === 0) {
      console.log('❌ No hay plantillas en la base de datos');
      console.log('\n💡 Necesitas crear las plantillas primero.');
      return;
    }
    
    console.log('Plantillas existentes:\n');
    templates.forEach(template => {
      console.log(`ID: ${template.id_Plantilla}`);
      console.log(`  Tipo: ${template.id_tipo_plantilla}`);
      console.log(`  Asunto: ${template.asunto_base || 'N/A'}`);
      console.log(`  Descripción: ${template.descripción_base || 'N/A'}`);
      console.log('');
    });
    
    // Verificar cuáles faltan (deberían existir del 1 al 14)
    const existingIds = templates.map(t => t.id_Plantilla);
    const missingIds = [];
    
    for (let i = 1; i <= 14; i++) {
      if (!existingIds.includes(i)) {
        missingIds.push(i);
      }
    }
    
    if (missingIds.length > 0) {
      console.log('⚠️  Plantillas faltantes:', missingIds.join(', '));
    } else {
      console.log('✅ Todas las plantillas (1-14) existen');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

checkTemplates();
