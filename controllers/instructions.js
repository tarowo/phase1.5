var instructionsController = new TKController({
  id: 'instructions',
  backButton: '.back',
  navigatesTo : [
	{ selector: '.game', controller: 'fishtank' },
  ],
});