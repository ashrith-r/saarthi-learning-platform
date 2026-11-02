import mongoose from 'mongoose';
import multer from 'multer';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import Resource from '../models/learningResource.js';
import Chapter from '../models/chapter.js';
import Lecture from '../models/lecture.js';
import Note from '../models/notes.js';
import Sheet from '../models/sheet.js';
import Settings from '../models/siteSettings.js';
import Audit from '../models/audit.js';
import { safeMaterialUrl, validateMaterial, videoSource } from '../services/materials.js';

const parseUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024, files: 1 }, fileFilter(req, file, cb) { if(file.mimetype !== 'application/pdf')return cb(new Error('Only PDF files are supported.'));cb(null,true); } }).single('pdf');
export function uploadPdf(req, res, next) {
  parseUpload(req, res, error => {
    if (error) return res.status(400).send('Upload one PDF no larger than 15 MB. Your changes were not saved.');
    if (req.file && req.file.buffer.subarray(0, 5).toString() !== '%PDF-') return res.status(400).send('This file is not a valid PDF.');
    next();
  });
}
export async function manager(req, res) {
  const chapters = await Chapter.find().populate('subjectID').sort({ chapterName: 1 });
  const selected = chapters.find(c => String(c._id) === req.query.chapter) || chapters[0];
  const [resources, lectures, notes, sheets] = selected ? await Promise.all([
    Resource.find({ chapter: selected._id }).sort({ position:1, createdAt:1 }), Lecture.find({ chapterID: selected._id }), Note.find({ chapterID: selected._id }), Sheet.find({ chapterID: selected._id })
  ]) : [[], [], [], []];
  res.render('study/material-manager', { chapters, selected, resources, lectures, notes, sheets, active: 'materials', videoSource });
}
export async function legacyVisibility(req,res) {
  const Model = {lecture:Lecture,note:Note,sheet:Sheet}[req.params.type];
  if(!Model)return res.status(400).send('Unknown resource type.');
  const material=await Model.findByIdAndUpdate(req.params.id,{published:req.body.published==='on'});
  if(!material)return res.status(404).send('Material not found.');
  await Audit.create({actor:req.user._id,action:req.body.published==='on'?'Material published':'Material hidden',details:material.title});
  res.redirect('/admin/materials?chapter='+material.chapterID);
}
export async function save(req, res) {
  const legacy = {lecture:Lecture,note:Note,sheet:Sheet}[req.params.type];
  const Model=legacy||Resource;
  const existing=req.params.id?await Model.findById(req.params.id):null;
  if (req.params.id && !existing) return res.status(404).send('Material not found.');
  if (!mongoose.isValidObjectId(req.body.chapter)) return res.status(400).send('Choose an existing chapter.');
  const chapter = await Chapter.findById(req.body.chapter);
  if (!chapter) return res.status(400).send('Choose an existing chapter.');
  const position=Number(req.body.position||0);
  if(!Number.isInteger(position)||position<0||position>9999)return res.status(400).send('Order must be a whole number from 0 to 9999.');
  if(legacy&&req.file)return res.status(400).send('Add a PDF material to upload a document. Existing lecture links remain available.');
  const error = validateMaterial(req.body, Boolean(req.file || (existing?.fileId && req.body.removePdf !== 'on')));
  if (error) return res.status(400).send(error);
  let fileId = req.body.removePdf === 'on' ? undefined : existing?.fileId;
  if (req.file) {
    const stream = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'materials' }).openUploadStream(req.file.originalname, { contentType: 'application/pdf' });
    await pipeline(Readable.from(req.file.buffer), stream); fileId = stream.id;
  }
  const data = { chapter: chapter._id, title: req.body.title.trim(), kind: req.body.kind, description: typeof req.body.description==='string'?req.body.description.trim():'', url: safeMaterialUrl(req.body.url) || '', fileId, filename: req.file?.originalname || existing?.filename, instructor: req.body.instructor || '', duration: req.body.duration || '', position, published: req.body.published === 'on', updatedBy: req.user._id };
  if(legacy){data.chapterID=chapter._id;data.faculty=data.instructor||existing.faculty;}
  if (existing) { Object.assign(existing, data); await existing.save(); } else await Resource.create({ ...data, createdBy: req.user._id });
  await Audit.create({ actor: req.user._id, action: existing ? 'Material updated' : 'Material created', details: data.title });
  req.flash('success', 'Material saved. Published changes are available to students immediately.');
  res.redirect('/admin/materials?chapter=' + chapter._id);
}
export async function file(req, res) {
  const resource = await Resource.findOne({ fileId: req.params.id, ...(req.user.admin || req.user.editor ? {} : { published: true, archived:{$ne:true} }) });
  if (!resource) return res.status(404).send('Document not found.');
  const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'materials' });
  if (!await bucket.find({ _id: resource.fileId }).hasNext()) return res.status(404).send('The document is unavailable. Contact your instructor.');
  res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `inline; filename="material.pdf"; filename*=UTF-8''${encodeURIComponent(resource.filename || 'material.pdf')}`, 'Cache-Control': 'private, no-store' });
  await pipeline(bucket.openDownloadStream(resource.fileId), res);
}
export async function settings(req, res) { res.render('study/site-settings', { active: 'settings' }); }
export async function saveSettings(req, res) {
  const fields = { name: 60 };
  const data = {};
  for (const [key, max] of Object.entries(fields)) { const value = req.body[key]; if (typeof value !== 'string' || !value.trim() || value.length > max) return res.status(400).send(`Check ${key}: enter 1–${max} characters.`); data[key] = value.trim(); }
  await Settings.findOneAndUpdate({ key: 'main' }, data, { upsert: true, runValidators: true });
  req.flash('success', 'Site content updated.'); res.redirect('/admin/site-settings');
}

export async function archive(req,res){
 const Model={resource:Resource,lecture:Lecture,note:Note,sheet:Sheet}[req.params.type];
 if(!Model)return res.status(400).send('Unknown material type.');
 const item=await Model.findById(req.params.id);if(!item)return res.status(404).send('Material not found.');
 item.archived=req.body.archived==='on';await item.save();
 await Audit.create({actor:req.user._id,action:item.archived?'Material archived':'Material restored',details:item.title});
 req.flash('success',item.archived?'Material archived. Restore it from the archived list.':'Material restored with its previous visibility.');
 res.redirect('/admin/materials?chapter='+(item.chapter||item.chapterID));
}
