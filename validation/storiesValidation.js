const Joi = require('joi');

// Joi validation schema for the Stories model
const storyValidationSchema = Joi.object({
    title: Joi.string().required().messages({
        'string.empty': 'Title is required',
        'any.required': 'Title is required',
    }),
    image: Joi.object({
        url: Joi.string().uri().required().messages({
            'string.empty': 'Image URL is required',
            'any.required': 'Image URL is required',
            'string.uri': 'Image URL must be a valid URI',
        }),
        filename: Joi.string().required().messages({
            'string.empty': 'Image filename is required', 
            'any.required': 'Image filename is required',
        }),
        publicId: Joi.string().required().messages({
            'string.empty': 'Image public ID is required',
            'any.required': 'Image public ID is required',
        }),
    }).optional(), // Image is optional for updates
    story: Joi.string().required().messages({ 
        'string.empty': 'Story content is required',
        'any.required': 'Story content is required',
    }),
    category:Joi.string().valid(
  'fantasy',
  'random-thoughts',
  'poetry',
  'sci-fi',
  'romance',
  'mystery',
  'horror',
  'drama',
  'adventure',
  'historical',
  'comedy',
  'ya',
  'children',
  'fanfiction',
  'other'
).required(),

    timeStamp: Joi.date().default(() => new Date().toISOString()),
    editedAt: Joi.date().optional(),
    owner: Joi.string().regex(/^[0-9a-fA-F]{24}$/).messages({
        'string.pattern.base': 'Owner ID must be a valid ObjectId',
    }).optional(), 
    likedBy: Joi.array().items(Joi.string().regex(/^[0-9a-fA-F]{24}$/)).messages({
        'string.pattern.base': 'LikedBy must contain valid ObjectIds',
    }).optional(),
    likesCounts: Joi.number().default(0).optional(),
    views: Joi.array().items(Joi.string().regex(/^[0-9a-fA-F]{24}$/)).messages({
        'string.pattern.base': 'Views must contain valid ObjectIds',
    }).optional(),
    comments: Joi.array().items(Joi.string().regex(/^[0-9a-fA-F]{24}$/)).messages({
        'string.pattern.base': 'Comments must contain valid ObjectIds',
    }).optional(),
});

// Validation middleware for creating a story
const validateStory = (req, res, next) => {
    const { error } = storyValidationSchema.validate(req.body, { abortEarly: false });
    if (error) {
        const errorMessages = error.details.map((detail) => detail.message);
        return res.status(400).json({ errors: errorMessages });
    }
    next();
};

// Validation middleware for updating a story
const validateStoryUpdate = (req, res, next) => {
    const { error } = storyValidationSchema.validate(req.body, { abortEarly: false, allowUnknown: true });
    if (error) {
        const errorMessages = error.details.map((detail) => detail.message);
        return res.status(400).json({ errors: errorMessages });
    }
    next();
};

module.exports = { validateStory, validateStoryUpdate };