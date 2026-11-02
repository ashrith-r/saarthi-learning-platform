import { v2 as cloudinary } from 'cloudinary';
import config from './config.js';
cloudinary.config({cloud_name:config.CLOUD_NAME,api_key:config.CLOUD_API_KEY,api_secret:config.CLOUD_API_SECRET});
const storage={
 _handleFile(req,file,cb){if(!config.CLOUD_NAME||!config.CLOUD_API_KEY||!config.CLOUD_API_SECRET){const error=new Error('Question image uploads are not configured. Add a text question or contact the administrator.');error.code='PROVIDER_NOT_CONFIGURED';return cb(error);}const stream=cloudinary.uploader.upload_stream({folder:'Saarthi/Questions',resource_type:'image',allowed_formats:['jpg','jpeg','png','webp']},(error,result)=>{if(error)return cb(error);cb(null,{path:result.secure_url,filename:result.public_id,size:result.bytes});});file.stream.on('error',error=>stream.destroy(error));file.stream.pipe(stream);},
 _removeFile(req,file,cb){cloudinary.uploader.destroy(file.filename).then(()=>cb(null)).catch(cb);}
};
export {cloudinary,storage};
