import mongoose from 'mongoose';
export default mongoose.model('SiteSettings', new mongoose.Schema({
  key: { type: String, unique: true, default: 'main' },
  name: { type: String, default: 'Saarthi', maxlength: 60 },
  heroTitle: { type: String, default: 'Your ambition has no ceiling.', maxlength: 160 },
  heroDescription: { type: String, default: 'Explore your subjects, build your confidence and take the next step toward the future you imagine.', maxlength: 500 },
  dashboardTitle: { type: String, default: 'Keep your next goal in sight.', maxlength: 140 },
  motivation: { type: String, default: 'Aim high. Start with the next chapter.', maxlength: 300 },
  revision: { type: Number, default: 0 }
}, { timestamps: true }));
