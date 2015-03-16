'use strict';
/* jshint expr: true */
/* global sinon: false */

describe('Controller: AuditsCtrl', function () {

  // load the controller's module
  beforeEach(module('openhimConsoleApp'));

  // setup config constant to be used for API server details
  beforeEach(function(){
    module('openhimConsoleApp', function($provide){
      $provide.constant('config', { 'protocol': 'https', 'host': 'localhost', 'port': 8080, 'title': 'Title', 'footerTitle': 'FooterTitle', 'footerPoweredBy': 'FooterPoweredBy' });
    });
  });

  var scope, createController, httpBackend, modalSpy;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope, $httpBackend, $modal) {

    httpBackend = $httpBackend;

    $httpBackend.when('GET', new RegExp('.*/audits-filter-options')).respond(
      {'eventType':[{ 'code': 'ITI-9', 'displayName': 'PIX Read', 'codeSystemName': 'IHE Transactions' }],
      'eventID':[{ 'code': '222', 'displayName': 'Read', 'codeSystemName': 'DCM' }],
      'activeParticipantRoleID':[{ 'code': '110152', 'displayName': 'Destination', 'codeSystemName': 'DCM' }],
      'participantObjectIDTypeCode':[{ 'code': '2', 'displayName': 'PatientNumber', 'codeSystemName': 'RFC-3881' }],
      'auditSourceID':['openhim']}
    );

    $httpBackend.when('GET', new RegExp('.*/audits')).respond([
      {
        'rawMessage': 'This will be the raw ATNA message that gets received to be used as a backup reference',
        'eventIdentification': {
          'eventDateTime': '2015-02-17T15:38:25.282+02:00',
          'eventOutcomeIndicator': '0',
          'eventActionCode': 'R',
          'eventID': { 'code': '222', 'displayName': 'Read', 'codeSystemName': 'DCM' },
          'eventTypeCode': { 'code': 'ITI-9', 'displayName': 'PIX Read', 'codeSystemName': 'IHE Transactions' }
        },
        'activeParticipant': [
          {
            'userID': 'pix|pix',
            'alternativeUserID': '2100',
            'userIsRequestor': 'false',
            'networkAccessPointID': 'localhost',
            'networkAccessPointTypeCode': '1',
            'roleIDCode': { 'code': '110152', 'displayName': 'Destination', 'codeSystemName': 'DCM' }
          }
        ],
        'auditSourceIdentification': { 'auditSourceID': 'openhim' },
        'participantObjectIdentification': [
          {
            'participantObjectID': '975cac30-68e5-11e4-bf2a-04012ce65b02^^^ECID&amp;ECID&amp;ISO',
            'participantObjectTypeCode': '1',
            'participantObjectTypeCodeRole': '1',
            'participantObjectIDTypeCode': { 'code': '2', 'displayName': 'PatientNumber', 'codeSystemName': 'RFC-3881' }
          }
        ]
      }, {
        'rawMessage': 'This will be the raw ATNA message that gets received to be used as a backup reference',
        'eventIdentification': {
          'eventDateTime': '2015-02-17T15:38:25.282+02:00',
          'eventOutcomeIndicator': '0',
          'eventActionCode': 'R',
          'eventID': { 'code': '222', 'displayName': 'Read', 'codeSystemName': 'DCM' },
          'eventTypeCode': { 'code': 'ITI-9', 'displayName': 'PIX Read', 'codeSystemName': 'IHE Transactions' }
        },
        'activeParticipant': [
          {
            'userID': 'pix|pix',
            'alternativeUserID': '2100',
            'userIsRequestor': 'false',
            'networkAccessPointID': 'localhost',
            'networkAccessPointTypeCode': '1',
            'roleIDCode': { 'code': '110152', 'displayName': 'Destination', 'codeSystemName': 'DCM' }
          }
        ],
        'auditSourceIdentification': { 'auditSourceID': 'openhim' },
        'participantObjectIdentification': [
          {
            'participantObjectID': '975cac30-68e5-11e4-bf2a-04012ce65b02^^^ECID&amp;ECID&amp;ISO',
            'participantObjectTypeCode': '1',
            'participantObjectTypeCodeRole': '1',
            'participantObjectIDTypeCode': { 'code': '2', 'displayName': 'PatientNumber', 'codeSystemName': 'RFC-3881' }
          }
        ]
      }
    ]);

    modalSpy = sinon.spy($modal, 'open');

    createController = function() {
      scope = $rootScope.$new();
      return $controller('AuditsCtrl', { $scope: scope });
    };

  }));

  afterEach(function() {
    httpBackend.verifyNoOutstandingExpectation();
    httpBackend.verifyNoOutstandingRequest();
  });

  it('should attach a list of audits to the scope', function () {
    createController();
    httpBackend.flush();
    scope.audits.length.should.equal(2);
    scope.auditsFilterOptions.eventType.length.should.equal(1);
    scope.auditsFilterOptions.eventID.length.should.equal(1);
    scope.auditsFilterOptions.activeParticipantRoleID.length.should.equal(1);
    scope.auditsFilterOptions.participantObjectIDTypeCode.length.should.equal(1);
    scope.auditsFilterOptions.auditSourceID.length.should.equal(1);
  });

  it('should check that the user prefered filters are set', function () {
    createController();
    httpBackend.flush();

    // the consoleSession object is setup with user profile in 'login.js'
    scope.settings.filter.limit.should.equal(10);
    scope.settings.list.tabview.should.equal('new');
  });

  it('should check filters are sent to the API', function () {
    createController();
    httpBackend.flush();

    scope.settings.filter.limit = 10;
    scope.settings.filter.dateStart = '2015-03-09T00:00:00+00:00';
    scope.settings.filter.dateEnd = '2015-03-09T00:00:00+00:00';
    scope.filters.eventIdentification.eventID = '222---Read---DCM';
    scope.filters.eventIdentification.eventTypeCode = 'ITI-9---PIX Read---IHE Transactions';
    scope.filters.eventIdentification.eventActionCode = 'R';
    scope.filters.eventIdentification.eventOutcomeIndicator = '0';
    scope.filters.participantObjectIdentification.patientID.patientID = '975cac30-68e5-11e4-bf2a-04012ce65b02';
    scope.filters.auditSourceIdentification.auditSourceID = 'openhim';

    var filters = scope.returnFilters('filtersObject');
    var urlParams = scope.returnFilters('urlParams');

    // filter object that gets sent through the API for query filtering
    filters.filterLimit.should.equal(10);
    filters.filters['eventIdentification.eventDateTime'].should.equal('{"$gte":"2015-03-09T00:00:00+00:00","$lte":"2015-03-09T23:59:59+00:00"}');
    filters.filters['participantObjectIdentification.participantObjectID'].should.equal('"975cac30-68e5-11e4-bf2a-04012ce65b02\\\\^\\\\^\\\\^.*&.*&.*"');
    filters.filters['eventIdentification.eventTypeCode.code'].should.equal('ITI-9');
    filters.filters['eventIdentification.eventTypeCode.codeSystemName'].should.equal('PIX Read');
    filters.filters['eventIdentification.eventTypeCode.displayName'].should.equal('IHE Transactions');
    filters.filters['eventIdentification.eventID.code'].should.equal('222');
    filters.filters['eventIdentification.eventID.codeSystemName'].should.equal('Read');
    filters.filters['eventIdentification.eventID.displayName'].should.equal('DCM');
    filters.filters['eventIdentification.eventActionCode'].should.equal('R');
    filters.filters['eventIdentification.eventOutcomeIndicator'].should.equal('0');
    filters.filters['auditSourceIdentification.auditSourceID'].should.equal('openhim');
    
    // url params string that gets used to reload the audits URL with selected paramaters
    urlParams.should.equal('&limit=10&dateStart=2015-03-09T00:00:00+00:00&dateEnd=2015-03-09T23:59:59+00:00&patientID=975cac30-68e5-11e4-bf2a-04012ce65b02&eventTypeCode=ITI-9---PIX Read---IHE Transactions&eventID=222---Read---DCM&eventActionCode=R&eventOutcomeIndicator=0&auditSourceID=openhim');
    
  });

});