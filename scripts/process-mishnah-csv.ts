/**
 * Script to process Sefaria's Mishnah Map CSV into TypeScript data
 * Run manually when CSV data needs to be updated
 */

const csvData = `Book,Mishnah Chapter,Start Mishnah,End Mishnah,Start Daf,Start Line,End Daf,End Line
Mishnah Zevachim,1,1,2,2a,1,2a,5
Mishnah Zevachim,1,3,3,11b,16,11b,17
Mishnah Zevachim,1,4,4,13a,5,13a,9
Mishnah Zevachim,2,1,1,15b,9,15b,10
Mishnah Zevachim,2,1,1,25a,5,25a,5
Mishnah Zevachim,2,1,1,26a,22,26a,22
Mishnah Zevachim,2,2,2,27b,14,27b,15
Mishnah Zevachim,2,3,3,29b,10,29b,10
Mishnah Zevachim,2,4,4,29b,11,29b,13
Mishnah Zevachim,2,5,5,29b,14,29b,15
Mishnah Zevachim,3,1,2,31b,14,32a,3
Mishnah Zevachim,3,3,3,35a,11,35a,12
Mishnah Zevachim,3,4,4,35a,13,35a,13
Mishnah Zevachim,3,5,5,35a,14,35a,15
Mishnah Zevachim,3,6,6,35b,21,36a,2
Mishnah Zevachim,4,1,2,36b,16,36b,19
Mishnah Zevachim,4,3,4,42b,12,43a,4
Mishnah Zevachim,4,5,5,45a,2,45a,2
Mishnah Zevachim,4,5,5,45b,6,45b,6
Mishnah Zevachim,4,6,6,46b,10,46b,11
Mishnah Zevachim,5,1,2,47a,12,47b,1
Mishnah Zevachim,5,3,3,52b,18,53a,1
Mishnah Zevachim,5,4,4,53b,2,53b,2
Mishnah Zevachim,5,5,5,54b,10,54b,11
Mishnah Zevachim,5,6,6,55a,9,55a,9
Mishnah Zevachim,5,7,7,55a,17,55a,17
Mishnah Zevachim,5,8,8,56b,10,56b,11
Mishnah Zevachim,6,1,1,58a,1,58a,1
Mishnah Zevachim,6,1,1,63a,2,63a,2
Mishnah Zevachim,6,2,3,63a,18,63b,1
Mishnah Zevachim,6,4,4,64b,5,64b,5
Mishnah Zevachim,6,5,5,64b,13,64b,14
Mishnah Zevachim,6,6,6,64b,15,64b,15
Mishnah Zevachim,6,7,7,64b,16,65a,4
Mishnah Zevachim,7,1,2,66a,7,66a,10
Mishnah Zevachim,7,3,4,66b,13,67a,2
Mishnah Zevachim,7,5,5,68a,7,68b,2
Mishnah Zevachim,7,6,6,69a,23,69b,4
Mishnah Zevachim,8,1,2,70b,15,71b,6
Mishnah Zevachim,8,3,3,75b,13,75b,15
Mishnah Zevachim,8,4,4,77a,7,77a,7
Mishnah Zevachim,8,5,5,77b,7,77b,7
Mishnah Zevachim,8,6,7,77b,10,78a,2
Mishnah Zevachim,8,8,8,79b,11,79b,11
Mishnah Zevachim,8,9,9,79b,12,79b,12
Mishnah Zevachim,8,10,10,80a,1,80a,4
Mishnah Zevachim,8,11,11,81b,14,81b,15
Mishnah Zevachim,8,12,12,82a,13,82a,16
Mishnah Zevachim,9,1,1,83a,15,83a,19
Mishnah Zevachim,9,2,2,84a,6,84a,7
Mishnah Zevachim,9,3,3,84a,8,84a,8
Mishnah Zevachim,9,4,4,84a,9,84a,9
Mishnah Zevachim,9,5,5,85b,15,85b,16
Mishnah Zevachim,9,6,7,86a,13,86a,14
Mishnah Zevachim,9,7,7,88a,5,88a,5
Mishnah Zevachim,10,1,1,89a,1,89a,1
Mishnah Zevachim,10,2,4,89a,8,89a,11
Mishnah Zevachim,10,5,5,90b,10,90b,11
Mishnah Zevachim,10,6,6,90b,12,90b,12
Mishnah Zevachim,10,7,7,90b,13,90b,13
Mishnah Zevachim,10,8,8,91a,20,91a,21
Mishnah Zevachim,11,1,2,92a,6,92a,7
Mishnah Zevachim,11,3,3,93a,15,93a,15
Mishnah Zevachim,11,3,4,93b,15,93b,17
Mishnah Zevachim,11,5,6,94b,13,94b,14
Mishnah Zevachim,11,7,7,95b,3,95b,3
Mishnah Zevachim,11,7,7,96b,18,97a,1
Mishnah Zevachim,11,8,8,97a,12,97a,13
Mishnah Zevachim,12,1,1,98b,6,98b,10
Mishnah Zevachim,12,2,3,103a,1,103a,3
Mishnah Zevachim,12,4,4,103b,13,103b,14
Mishnah Zevachim,12,5,6,104a,20,104b,1
Mishnah Zevachim,13,1,2,106a,9,106a,12
Mishnah Zevachim,13,3,3,108a,17,108a,20
Mishnah Zevachim,13,4,4,109a,1,109a,2
Mishnah Zevachim,13,4,5,109b,4,109b,6
Mishnah Zevachim,13,5,5,110a,17,110a,17
Mishnah Zevachim,13,6,6,110a,20,110a,21
Mishnah Zevachim,13,6,6,110a,28,110b,1
Mishnah Zevachim,13,7,7,111a,18,111b,3
Mishnah Zevachim,13,8,8,111b,15,111b,18
Mishnah Zevachim,14,1,1,112a,11,112a,12
Mishnah Zevachim,14,2,2,112a,13,112b,3
Mishnah Zevachim,14,3,3,112b,4,112b,8
Mishnah Zevachim,14,4,5,112b,9,112b,9
Mishnah Zevachim,14,6,6,112b,10,112b,10
Mishnah Zevachim,14,7,7,112b,11,112b,11
Mishnah Zevachim,14,8,8,112b,12,112b,12
Mishnah Zevachim,14,9,9,112b,13,112b,14
Mishnah Zevachim,14,10,10,112b,15,113a,2
Mishnah Menachot,1,1,1,2a,1,2a,3
Mishnah Menachot,1,2,2,6a,19,6a,21
Mishnah Menachot,1,2,3,11a,18,11a,18
Mishnah Menachot,1,3,4,11b,13,12a,7
Mishnah Menachot,1,4,4,12b,12,12b,12
Mishnah Menachot,2,1,1,13a,7,13a,8
Mishnah Menachot,2,2,2,13b,15,13b,15
Mishnah Menachot,2,2,2,14b,20,14b,20
Mishnah Menachot,2,3,3,15a,7,15a,8
Mishnah Menachot,2,4,4,15b,11,15b,11
Mishnah Menachot,2,5,5,16a,1,16a,4
Mishnah Menachot,3,1,1,17a,16,17a,17
Mishnah Menachot,3,2,2,18a,11,18a,11
Mishnah Menachot,3,2,2,22a,6,22a,7
Mishnah Menachot,3,3,3,23a,12,23a,14
Mishnah Menachot,3,3,3,25a,1,25a,1
Mishnah Menachot,3,4,4,26a,2,26a,2
Mishnah Menachot,3,4,4,26a,13,26a,13
Mishnah Menachot,3,5,5,27a,3,27a,4
Mishnah Menachot,3,6,6,27a,11,27a,14
Mishnah Menachot,3,7,7,28a,6,28a,7
Mishnah Menachot,4,1,1,38a,4,38a,4
Mishnah Menachot,4,1,1,44b,2,44b,2
Mishnah Menachot,4,2,2,44b,12,44b,12
Mishnah Menachot,4,3,3,45b,2,45b,7
Mishnah Menachot,4,4,4,49a,16,49a,19
Mishnah Menachot,4,5,5,50b,4,50b,5
Mishnah Menachot,4,5,5,51b,2,51b,2
Mishnah Menachot,5,1,1,52b,12,52b,14
Mishnah Menachot,5,2,2,55a,10,55a,10
Mishnah Menachot,5,3,3,59a,1,59a,5
Mishnah Menachot,5,4,4,59b,5,59b,6
Mishnah Menachot,5,5,5,60a,6,60a,8
Mishnah Menachot,5,6,7,61a,5,61a,10
Mishnah Menachot,5,8,8,63a,1,63a,1
Mishnah Menachot,5,9,9,63a,9,63a,10
Mishnah Menachot,6,1,1,72b,19,72b,20
Mishnah Menachot,6,2,2,74b,3,74b,3
Mishnah Menachot,6,3,3,74b,10,74b,11
Mishnah Menachot,6,4,4,75a,14,75a,14
Mishnah Menachot,6,4,4,75b,2,75b,2
Mishnah Menachot,6,5,5,76a,1,76a,1
Mishnah Menachot,6,6,6,76b,4,76b,4
Mishnah Menachot,6,7,7,76b,9,76b,9
Mishnah Menachot,7,1,1,76b,15,77a,2
Mishnah Menachot,7,2,2,77b,1,77b,1
Mishnah Menachot,7,2,2,78a,5,78a,6
Mishnah Menachot,7,3,3,78b,1,78b,1
Mishnah Menachot,7,3,3,78b,20,78b,22
Mishnah Menachot,7,4,4,79a,15,79a,15
Mishnah Menachot,7,4,4,79b,12,79b,12
Mishnah Menachot,7,5,5,81a,12,81b,1
Mishnah Menachot,7,6,6,82a,10,82a,11
Mishnah Menachot,8,1,1,83b,10,83b,12
Mishnah Menachot,8,2,2,85a,4,85a,7
Mishnah Menachot,8,3,3,85b,11,85b,12
Mishnah Menachot,8,4,4,86a,7,86a,19
Mishnah Menachot,8,5,5,86a,28,86a,29
Mishnah Menachot,8,6,7,86b,11,87a,3
Mishnah Menachot,9,1,1,87a,21,87a,23
Mishnah Menachot,9,2,2,87b,19,87b,22
Mishnah Menachot,9,3,3,88a,15,88a,20
Mishnah Menachot,9,4,4,89a,20,89b,3
Mishnah Menachot,9,5,5,90a,3,90a,5
Mishnah Menachot,9,6,6,90b,5,90b,5
Mishnah Menachot,9,7,7,92a,2,92a,4
Mishnah Menachot,9,8,8,93a,11,93a,13
Mishnah Menachot,9,9,9,93b,20,94a,1
Mishnah Menachot,10,1,1,63b,9,63b,10
Mishnah Menachot,10,2,2,64b,2,64b,2
Mishnah Menachot,10,3,3,65a,4,65a,7
Mishnah Menachot,10,4,4,66a,17,66a,18
Mishnah Menachot,10,4,5,67b,4,67b,5
Mishnah Menachot,10,5,5,68a,11,68a,12
Mishnah Menachot,10,6,6,68b,11,68b,11
Mishnah Menachot,10,7,7,70a,16,70a,16
Mishnah Menachot,10,8,9,71a,7,71a,9
Mishnah Menachot,11,1,1,94a,11,94a,11
Mishnah Menachot,11,2,2,95b,3,95b,3
Mishnah Menachot,11,3,3,96a,3,96a,3
Mishnah Menachot,11,4,4,96a,4,96a,6
Mishnah Menachot,11,5,5,96a,7,96a,11
Mishnah Menachot,11,6,6,96a,12,96a,14
Mishnah Menachot,11,7,7,99b,8,99b,14
Mishnah Menachot,11,8,8,100a,5,100a,7
Mishnah Menachot,11,9,9,100b,3,100b,5
Mishnah Menachot,12,1,1,100b,9,100b,10
Mishnah Menachot,12,2,2,102b,10,102b,15
Mishnah Menachot,12,3,3,103a,4,103a,5
Mishnah Menachot,12,4,4,103b,8,103b,11
Mishnah Menachot,12,4,4,104a,4,104a,4
Mishnah Menachot,12,5,5,104b,2,104b,4
Mishnah Menachot,13,1,2,104b,13,104b,16
Mishnah Menachot,13,3,4,106b,14,106b,16
Mishnah Menachot,13,5,5,107a,9,107a,10
Mishnah Menachot,13,6,6,107a,20,107b,1
Mishnah Menachot,13,7,7,107b,2,107b,2
Mishnah Menachot,13,8,8,107b,3,107b,6
Mishnah Menachot,13,9,9,108a,21,108a,22
Mishnah Menachot,13,9,9,108b,19,108b,19
Mishnah Menachot,13,10,10,109a,4,109a,5
Mishnah Menachot,13,10,10,109a,14,109a,14
Mishnah Menachot,13,11,11,110a,14,110a,14
Mishnah Chullin,1,1,1,2a,1,2a,1
Mishnah Chullin,1,1,1,13a,12,13a,12
Mishnah Chullin,1,1,1,13b,11,13b,11
Mishnah Chullin,1,1,1,14a,1,14a,1
Mishnah Chullin,1,2,2,15b,7,15b,8
Mishnah Chullin,1,2,2,18a,9,18a,9
Mishnah Chullin,1,3,3,18a,11,18a,11
Mishnah Chullin,1,4,4,19b,12,19b,12
Mishnah Chullin,1,5,5,22a,13,22a,13
Mishnah Chullin,1,6,6,23b,11,23b,11
Mishnah Chullin,1,6,6,24a,7,24a,7
Mishnah Chullin,1,6,6,24b,10,24b,10
Mishnah Chullin,1,6,6,25a,11,25a,11
Mishnah Chullin,1,6,6,25b,5,25b,5
Mishnah Chullin,1,7,7,25b,9,25b,10
Mishnah Chullin,1,7,7,26b,4,26b,4
Mishnah Chullin,1,7,7,26b,8,26b,8
Mishnah Chullin,1,7,7,26b,10,26b,12
Mishnah Chullin,2,1,1,27a,1,27a,1
Mishnah Chullin,2,2,3,30b,11,30b,12
Mishnah Chullin,2,3,3,31a,12,31a,12
Mishnah Chullin,2,3,3,32a,4,32a,4
Mishnah Chullin,2,4,4,32a,17,32a,18
Mishnah Chullin,2,5,5,33a,9,33a,9
Mishnah Chullin,2,6,6,37a,2,37a,3
Mishnah Chullin,2,7,7,38b,7,38b,8
Mishnah Chullin,2,8,8,39b,20,40a,1
Mishnah Chullin,2,9,9,41a,9,41b,1
Mishnah Chullin,2,10,10,41b,8,41b,10
Mishnah Chullin,3,1,1,42a,3,42a,5
Mishnah Chullin,3,2,2,54a,13,54a,14
Mishnah Chullin,3,3,3,56a,2,56a,2
Mishnah Chullin,3,4,4,56b,9,56b,9
Mishnah Chullin,3,5,5,58b,13,58b,13
Mishnah Chullin,3,6,7,59a,6,59a,7
Mishnah Chullin,4,1,1,68a,1,68a,2
Mishnah Chullin,4,2,2,69b,10,69b,10
Mishnah Chullin,4,3,3,70b,1,70b,1
Mishnah Chullin,4,3,3,71a,16,71a,16
Mishnah Chullin,4,4,4,72a,11,72b,7
Mishnah Chullin,4,5,5,74a,16,74b,1
Mishnah Chullin,4,6,6,76a,1,76a,2
Mishnah Chullin,4,7,7,77a,11,77a,13
Mishnah Chullin,5,1,2,78a,5,78a,14
Mishnah Chullin,5,3,3,81b,4,81b,5
Mishnah Chullin,5,3,3,82a,9,82a,9
Mishnah Chullin,5,3,3,82a,11,82a,12
Mishnah Chullin,5,3,4,83a,6,83a,8
Mishnah Chullin,5,5,5,83a,15,83a,15
Mishnah Chullin,6,1,1,83b,3,83b,4
Mishnah Chullin,6,2,2,85a,7,85a,8
Mishnah Chullin,6,3,3,86a,6,86a,7
Mishnah Chullin,6,4,4,86b,7,86b,7
Mishnah Chullin,6,4,4,87a,2,87a,2
Mishnah Chullin,6,5,6,87a,14,87b,2
Mishnah Chullin,6,7,7,88a,7,88a,7
Mishnah Chullin,7,1,1,89b,3,89b,5
Mishnah Chullin,7,2,2,93b,21,93b,21
Mishnah Chullin,7,2,3,96a,5,96a,6
Mishnah Chullin,7,4,5,96b,6,96b,8
Mishnah Chullin,7,6,6,100b,3,100b,3
Mishnah Chullin,8,1,1,104b,6,104b,7
Mishnah Chullin,8,1,1,103b,16,104a,1
Mishnah Chullin,8,2,2,107b,15,107b,15
Mishnah Chullin,8,3,3,108a,2,108a,2
Mishnah Chullin,8,3,3,109a,9,109a,9
Mishnah Chullin,8,3,3,113a,16,113a,16
Mishnah Chullin,8,4,4,113a,18,113a,19
Mishnah Chullin,8,5,5,116a,17,116b,1
Mishnah Chullin,8,6,6,116b,17,117a,2
Mishnah Chullin,9,1,1,117b,6,117b,9
Mishnah Chullin,9,2,2,122a,10,122a,12
Mishnah Chullin,9,3,3,123a,4,123a,7
Mishnah Chullin,9,4,4,124a,18,124a,19
Mishnah Chullin,9,5,5,124b,25,125a,2
Mishnah Chullin,9,6,6,126b,11,126b,11
Mishnah Chullin,9,7,7,127a,20,127b,2
Mishnah Chullin,9,8,8,129b,10,129b,10
Mishnah Chullin,10,1,2,130a,1,130a,7
Mishnah Chullin,10,3,3,132a,17,132a,19
Mishnah Chullin,10,4,4,134a,8,134a,8
Mishnah Chullin,10,4,4,134b,14,134b,14
Mishnah Chullin,11,1,2,135a,1,135a,7
Mishnah Chullin,12,1,2,138b,3,138b,4
Mishnah Chullin,12,3,3,140b,13,140b,14
Mishnah Chullin,12,3,3,141a,5,141a,5
Mishnah Chullin,12,4,4,141a,16,141a,16
Mishnah Chullin,12,5,5,142a,2,142a,2
Mishnah Bekhorot,1,1,1,2a,1,2a,1
Mishnah Bekhorot,1,1,1,3b,15,3b,15
Mishnah Bekhorot,1,2,2,5b,7,5b,8
Mishnah Bekhorot,1,2,2,7b,15,7b,15
Mishnah Bekhorot,1,3,3,9a,3,9a,4
Mishnah Bekhorot,1,4,4,9a,5,9a,6
Mishnah Bekhorot,1,5,5,12a,1,12a,1
Mishnah Bekhorot,1,6,6,12b,16,12b,17
Mishnah Bekhorot,1,7,7,13a,4,13a,7
Mishnah Bekhorot,2,1,1,13a,9,13a,10
Mishnah Bekhorot,2,2,3,14a,1,14a,4
Mishnah Bekhorot,2,4,5,16a,15,16b,2
Mishnah Bekhorot,2,6,6,17a,21,17b,1
Mishnah Bekhorot,2,7,8,18b,13,18b,16
Mishnah Bekhorot,2,9,9,19a,2,19a,2
Mishnah Bekhorot,3,1,1,19b,5,19b,7
Mishnah Bekhorot,3,1,1,21b,9,21b,9
Mishnah Bekhorot,3,2,2,23b,8,23b,8
Mishnah Bekhorot,3,3,3,24b,5,24b,5
Mishnah Bekhorot,3,4,4,25a,17,25b,2
Mishnah Bekhorot,4,1,2,26b,8,26b,9
Mishnah Bekhorot,4,3,4,28a,12,28a,12
Mishnah Bekhorot,4,4,4,28b,8,28b,8
Mishnah Bekhorot,4,4,4,28b,12,28b,14
Mishnah Bekhorot,4,5,5,28b,17,29a,1
Mishnah Bekhorot,4,6,6,29a,5,29a,6
Mishnah Bekhorot,4,7,7,29b,4,29b,4
Mishnah Bekhorot,4,8,8,29b,11,29b,11
Mishnah Bekhorot,4,9,9,29b,13,29b,13
Mishnah Bekhorot,4,10,10,30a,3,30a,3
Mishnah Bekhorot,5,1,1,31a,14,31a,16
Mishnah Bekhorot,5,2,2,32b,9,32b,9
Mishnah Bekhorot,5,2,2,33b,5,33b,5
Mishnah Bekhorot,5,3,3,34a,10,34a,10
Mishnah Bekhorot,5,3,3,35a,2,35a,3
Mishnah Bekhorot,5,4,4,35a,10,35a,10
Mishnah Bekhorot,5,4,4,35a,17,35a,17
Mishnah Bekhorot,5,5,5,36a,17,36a,17
Mishnah Bekhorot,5,5,5,36b,13,36b,13
Mishnah Bekhorot,5,5,5,36b,16,36b,16
Mishnah Bekhorot,5,6,6,37a,6,37a,7
Mishnah Bekhorot,6,1,1,37a,15,37a,15
Mishnah Bekhorot,6,2,2,38a,21,38a,21
Mishnah Bekhorot,6,3,3,38b,10,38b,11
Mishnah Bekhorot,6,4,4,39a,8,39a,8
Mishnah Bekhorot,6,4,4,39a,10,39a,10
Mishnah Bekhorot,6,5,5,39b,12,39b,12
Mishnah Bekhorot,6,6,6,40a,5,40a,5
Mishnah Bekhorot,6,7,7,40a,11,40a,11
Mishnah Bekhorot,6,8,8,40a,15,40a,16
Mishnah Bekhorot,6,9,9,40a,23,40a,23
Mishnah Bekhorot,6,9,9,40b,4,40b,4
Mishnah Bekhorot,6,10,10,40b,9,40b,9
Mishnah Bekhorot,6,11,11,40b,18,40b,18
Mishnah Bekhorot,6,11,11,41a,2,41a,2
Mishnah Bekhorot,6,12,12,41a,5,41a,6
Mishnah Bekhorot,7,1,2,43a,4,43a,5
Mishnah Bekhorot,7,2,2,43b,13,43b,13
Mishnah Bekhorot,7,3,3,43b,17,43b,17
Mishnah Bekhorot,7,4,5,44a,14,44a,14
Mishnah Bekhorot,7,5,5,44b,1,44b,1
Mishnah Bekhorot,7,5,5,44b,14,44b,14
Mishnah Bekhorot,7,6,6,44b,18,45a,3
Mishnah Bekhorot,7,6,6,45b,5,45b,5
Mishnah Bekhorot,7,7,7,45b,11,45b,12
Mishnah Bekhorot,8,1,1,46a,5,46a,11
Mishnah Bekhorot,8,1,2,47b,11,47b,12
Mishnah Bekhorot,8,3,3,48a,1,48a,2
Mishnah Bekhorot,8,4,4,48b,11,48b,17
Mishnah Bekhorot,8,5,6,49a,5,49a,5
Mishnah Bekhorot,8,6,6,49a,11,49a,11
Mishnah Bekhorot,8,7,7,49b,10,49b,11
Mishnah Bekhorot,8,8,8,51a,7,51a,8
Mishnah Bekhorot,8,9,9,51b,12,52a,1
Mishnah Bekhorot,8,10,10,52b,3,52b,4
Mishnah Bekhorot,9,1,1,53a,1,53a,2
Mishnah Bekhorot,9,2,2,54b,10,54b,10
Mishnah Bekhorot,9,3,3,55b,9,55b,9
Mishnah Bekhorot,9,3,3,56b,7,56b,8
Mishnah Bekhorot,9,4,4,57a,6,57a,6
Mishnah Bekhorot,9,5,6,57b,6,57b,9
Mishnah Bekhorot,9,7,7,58b,4,58b,5
Mishnah Bekhorot,9,8,8,60a,7,60a,9
Mishnah Arakhin,1,1,1,2a,1,2a,3
Mishnah Arakhin,1,1,1,5a,16,5a,16
Mishnah Arakhin,1,2,2,5b,7,5b,7
Mishnah Arakhin,1,3,3,6b,8,6b,8
Mishnah Arakhin,1,4,4,7a,11,7a,11
Mishnah Arakhin,2,1,1,7b,15,7b,16
Mishnah Arakhin,2,1,1,8a,5,8a,5
Mishnah Arakhin,2,1,1,8b,9,8b,9
Mishnah Arakhin,2,2,2,8b,15,8b,16
Mishnah Arakhin,2,3,4,10a,2,10a,4
Mishnah Arakhin,2,5,5,13a,9,13a,9
Mishnah Arakhin,2,6,6,13b,6,13b,7
Mishnah Arakhin,3,1,1,13b,17,13b,18
Mishnah Arakhin,3,2,2,14a,5,14a,6
Mishnah Arakhin,3,3,3,14b,19,14b,19
Mishnah Arakhin,3,4,4,14b,22,14b,22
Mishnah Arakhin,3,5,5,15a,5,15a,6
Mishnah Arakhin,4,1,1,17a,9,17a,12
Mishnah Arakhin,4,2,3,17b,6,17b,7
Mishnah Arakhin,4,4,4,18a,9,18a,10
Mishnah Arakhin,4,4,4,18a,13,18a,15
Mishnah Arakhin,5,1,1,19a,4,19a,5
Mishnah Arakhin,5,2,2,19b,13,19b,13
Mishnah Arakhin,5,2,2,20a,7,20a,8
Mishnah Arakhin,5,3,3,20a,9,20a,9
Mishnah Arakhin,5,4,4,20a,10,20a,10
Mishnah Arakhin,5,5,5,20b,2,20b,2
Mishnah Arakhin,5,6,6,21a,5,21a,6
Mishnah Arakhin,6,1,1,21b,13,21b,13
Mishnah Arakhin,6,1,1,22a,14,22a,15`;

interface MishnahMapping {
  book: string;
  tractate: string;
  mishnahChapter: number;
  startMishnah: number;
  endMishnah: number;
  startDaf: string;
  startLine: number;
  endDaf: string;
  endLine: number;
}

function parseCSV(csvText: string): MishnahMapping[] {
  const lines = csvText.split('\n').slice(1); // Skip header
  const mappings: MishnahMapping[] = [];

  for (const line of lines) {
    const [book, chapter, startMishnah, endMishnah, startDaf, startLine, endDaf, endLine] = line.split(',');
    
    if (!book || !chapter) continue;

    // Extract tractate name by removing "Mishnah " prefix
    const tractate = book.replace(/^Mishnah\s+/, '');

    mappings.push({
      book,
      tractate,
      mishnahChapter: parseInt(chapter),
      startMishnah: parseInt(startMishnah),
      endMishnah: parseInt(endMishnah),
      startDaf,
      startLine: parseInt(startLine),
      endDaf,
      endLine: parseInt(endLine)
    });
  }

  return mappings;
}

function generateTypeScriptFile(mappings: MishnahMapping[]): string {
  return `/**
 * Mishnah-Talmud Mapping Data
 * Generated from Sefaria's Mishnah Map CSV
 * Source: https://github.com/Sefaria/Sefaria-Project/blob/master/data/Mishnah%20Map.csv
 */

export interface MishnahMapping {
  book: string;
  tractate: string;
  mishnahChapter: number;
  startMishnah: number;
  endMishnah: number;
  startDaf: string;
  startLine: number;
  endDaf: string;
  endLine: number;
}

export const MISHNAH_MAP_DATA: MishnahMapping[] = ${JSON.stringify(mappings, null, 2)};

/**
 * Get the section number for the first Mishnah of a given chapter
 * @param tractate - Tractate name (case-insensitive)
 * @param chapter - Chapter number
 * @param page - Talmud page (e.g., "90a", "2b")
 * @returns Section number or null if not found
 */
export function getMishnahSection(tractate: string, chapter: number, page: string): number | null {
  const normalizedTractate = tractate.toLowerCase();
  const normalizedPage = page.toLowerCase();

  // Find the first mishnah of the given chapter that starts on the given page
  const mapping = MISHNAH_MAP_DATA.find(
    m => 
      m.tractate.toLowerCase() === normalizedTractate &&
      m.mishnahChapter === chapter &&
      m.startMishnah === 1 &&
      m.startDaf.toLowerCase() === normalizedPage
  );

  return mapping ? mapping.startLine : null;
}

/**
 * Get the chapter number for a given page
 * @param tractate - Tractate name (case-insensitive)
 * @param page - Talmud page (e.g., "90a", "2b")
 * @returns Chapter number or null if not found
 */
export function getChapterForPage(tractate: string, page: string): number | null {
  const normalizedTractate = tractate.toLowerCase();
  const normalizedPage = page.toLowerCase();

  const mapping = MISHNAH_MAP_DATA.find(
    m => 
      m.tractate.toLowerCase() === normalizedTractate &&
      m.startDaf.toLowerCase() === normalizedPage &&
      m.startMishnah === 1
  );

  return mapping ? mapping.mishnahChapter : null;
}

/**
 * Get all mappings for a specific tractate
 * @param tractate - Tractate name (case-insensitive)
 * @returns Array of all Mishnah mappings for the tractate
 */
export function getTractateMap(tractate: string): MishnahMapping[] {
  const normalizedTractate = tractate.toLowerCase();
  return MISHNAH_MAP_DATA.filter(
    m => m.tractate.toLowerCase() === normalizedTractate
  );
}

/**
 * Get all unique tractates in the mapping
 * @returns Array of unique tractate names
 */
export function getAllTractates(): string[] {
  const tractates = new Set(MISHNAH_MAP_DATA.map(m => m.tractate));
  return Array.from(tractates).sort();
}
`;
}

// Main execution
console.log('Processing Mishnah Map CSV...');
const mappings = parseCSV(csvData);
console.log(`Parsed ${mappings.length} Mishnah mappings`);

const tsContent = generateTypeScriptFile(mappings);
console.log('Generated TypeScript file content');
console.log('\n--- OUTPUT ---\n');
console.log(tsContent);
