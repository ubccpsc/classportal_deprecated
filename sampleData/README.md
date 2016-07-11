# Load Students Schema

Students will always be specified with a CSV with the following columns:

```
CSID,SNUM,LAST,FIRST
````

CSID can be assumed to be unique; if a CSID is already known in the Portal we can assume it is known. If a CSID is not present in the Portal the student should be updated. If a CSID is present in the Portal but not in the file, for now just ignore the student.

During the 'Link Github' part of the authentication, if a student is not known to the Portal they should not get access to the system.


# Load Admins Schema

Admins will be specified with a JSON document containing an array of the following objects:

```
{
id:    'githubId',
role:  'ta | prof',
teams: ['teamId1', 'teamId2']
}
```

The ```id``` can be assumed to be unique; if it is already known to the Portal the admin record should be updated (in case the role or teams change). Role can be ```ta``` or ```prof```. The teams array can be empty (e.g., for the prof or at the start of the term when the teams are not known). Later in the term once the team Ids are known the file can be uploaded again and the admins will be linked to the right teams.


 