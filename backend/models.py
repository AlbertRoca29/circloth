
# Canonical item field schema for Circloth
ITEM_FIELDS = {
	'category': {'required': True},
	'size': {'required': True},
	'itemStory': {'required': True},
	'photoURLs': {'required': True, 'min_length': 2},
	'ownerId': {'required': True},
	'color': {'required': False},
	'brand': {'required': False},
	'material': {'required': False},
	'additionalInfo': {'required': False},
	'sizeDetails': {'required': False},
}
