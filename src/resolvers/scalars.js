import {
  DateTimeResolver,
  EmailAddressResolver,
  PostalCodeResolver,
  PhoneNumberResolver
} from 'graphql-scalars';

module.exports = {
  // on crée les nouveaux type
  DateTime: DateTimeResolver,
  Email: EmailAddressResolver,
  Postal: PostalCodeResolver,
  Telephone: PhoneNumberResolver
};
